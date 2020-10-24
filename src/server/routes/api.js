var express = require('express');
var router = express.Router();

const axios = require('axios').default;
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const Analyzer = require('natural').SentimentAnalyzer;
const stemmer = require('natural').PorterStemmer;

/** create a redis client and connect to redis */
const redis_url = process.env.REDIS_URL || "redis://127.0.0.1";
const redis = require('redis');
const redis_client = redis.createClient(redis_url);
const DEFAULT_REDIS_TIME = 3600;
redis_client.on('error', () => {
  console.log("Error Redis");
})

/** connect to AWS S3 Bucket */
const AWS = require("aws-sdk");
const S3_api_ver = '2006-03-01'
const bucket_name = 'music-sentiments-analyzer-s3';
AWS.config.getCredentials((err) => {
  if (err) {
    console.log("credential for S3 not loaded");
  } else {
    console.log("credential for S3 is loaded")
  }
});

const bucket_promise = new AWS.S3({
  apiVersion: S3_api_ver
}).createBucket({
  Bucket: bucket_name
}).promise();

bucket_promise.then((data) => {
  console.log(`AWS S3 Bucket Creation Success`);
}).catch((err) => {
  console.log(err);
  console.log(`AWS S3 Failed to create ${bucket_name} bucket`);
})

router.post('/music', function (req, res, next) {
  const token = req.body.access_token;
  const query = JSON.stringify(req.body.search).toLowerCase().replace(/\"/g, "");

  const redis_key = `redis-${query.replace(" ", "-")}`;
  const S3_key = `S3-${query.replace(" ", "-")}`;
  const S3_params = {
    Bucket: bucket_name,
    Key: S3_key
  }

  /** contructing the Spotify get URL */
  /** if tract is given by the user search music by track, if not search by recommendation */
  let url = "https://api.spotify.com/v1/recommendations?seed_artists=4NHQUGzhtTLFvgF5SZesLK";
  if (req.body.search) {
    url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=50`;
    console.log(url)
  }

  /** configure the request header */
  const config = {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }

  return redis_client.get(redis_key, (err, result) => { /** check redis server */
    if (result) { /** server from redis */
      console.log(`serving ${req.body.search} from redis`)
      const result_JSON = JSON.parse(result);
      return res.status(200).json(result_JSON);
    } else { /** check S3 bucket */

      return new AWS.S3({
        apiVersion: S3_api_ver
      }).getObject(S3_params, (err, result) => {
        if (result) { /** server from S3 Bucket */
          const result_JSON = JSON.parse(result.Body);

          /** store it on redis cache */
          let redis_JSON = JSON.parse(result.Body);
          redis_JSON.source = "Redis Cache";
          redis_client.setex(redis_key, DEFAULT_REDIS_TIME, JSON.stringify({
            ...redis_JSON
          }))

          /** server to the client */
          console.log(`serving ${req.body.search} from S3 bucket`)
          return res.status(200).json(result_JSON);

        } else { /** server from axios */

          /** get the spotify request */
          axios.get(url, config)
            .then(({ data }) => {
              let res_data = [];

              /** get the lyric */
              const lyric_api_url = "https://api.lyrics.ovh/v1";
              let lyric_url = [];
              let lyrics = [];
              if (req.body.search) {
                lyric_url = data.tracks.items.map((t) => `${lyric_api_url}/${t.album.artists[0].name}/${t.name}`);
              } else {
                lyric_url = data.tracks.map((t) => `${lyric_api_url}/${t.album.artists[0].name}/${t.name}`);
              }

              /** get the lyric from the lyrics.ovh API */
              const request_lyric = () => {
                return Promise.all(lyric_url.map((url) => {
                  return axios.get(url)
                    .then((lyric) => {
                      if (lyric.data.lyrics === undefined) {
                        lyrics.push(null);
                      } else {
                        lyrics.push(lyric.data.lyrics);
                      }
                    }).catch((err) => {
                      lyrics.push(null);
                    })
                }))
              }

              /** get the lyric and process it through Natural Node */
              request_lyric()
                .then(() => {
                  /** process the lyric using the natural NODE */
                  /** tokenize the lyrics */
                  let tokenized_lyric = [];
                  lyrics.map((l) => {
                    if (l) {
                      tokenized_lyric.push(tokenizer.tokenize(l))
                    } else {
                      tokenized_lyric.push(null);
                    };
                  })

                  /** get the word frequency of the lyric */
                  let frequency = [];
                  for (let i = 0; i < tokenized_lyric.length; i++) {
                    if (tokenized_lyric[i] == null) {
                      frequency.push(null);
                    } else {
                      /** get the frequency of the words */
                      let output = {};
                      for (let j = 0; j < tokenized_lyric[i].length; j++) {
                        if (output[tokenized_lyric[i][j]] === undefined) {
                          output[tokenized_lyric[i][j]] = 1;
                        } else {
                          output[tokenized_lyric[i][j]] += 1;
                        }
                      }
                      var sortable = [];
                      for (var word in output) {
                        sortable.push([word, output[word]]);
                      }
                      sortable.sort((a, b) => {
                        return b[1] - a[1];
                      });
                      let top10 = sortable.slice(0, 10).map((i) => {
                        return { [i[0]]: i[1] }
                      })
                      frequency.push(top10);
                    }
                  }

                  /** setup the sentiment analyzer */
                  let analyzer = new Analyzer("English", stemmer, "afinn");
                  /** do the sentiments Analysis */
                  let sentiments = tokenized_lyric.map((tl) => {
                    if (tl) {
                      /** get the sentiment number */
                      return analyzer.getSentiment(tl);
                    } else {
                      return 0;
                    }
                  });

                  /** get assign the tag bassed on the sentiments number */
                  let tag = sentiments.map((s) => {
                    if (s > 0) return "positive";
                    if (s == 0) return "neutral";
                    if (s < 0) return "negative";
                  })

                  /** make the JSON response */
                  if (req.body.search) {
                    res_data = data.tracks.items.map((t, i) => {
                      return {
                        song_title: t.name,
                        song_url: t.external_urls.spotify,
                        artists_name: t.album.artists[0].name,
                        artists_url: t.album.artists[0].uri,
                        track_images: t.album.images[0].url,
                        preview_url: t.preview_url,
                        popularity: t.popularity,
                        lyric: lyrics[i],
                        frequency: frequency[i],
                        sentiment: {
                          number: sentiments[i],
                          tag: tag[i]
                        }
                      }
                    })
                  } else {
                    res_data = data.tracks.map((t, i) => {
                      return {
                        song_title: t.name,
                        song_url: t.external_urls.spotify,
                        artists_name: t.album.artists[0].name,
                        track_images: t.album.images[0].url,
                        preview_url: t.preview_url,
                        popularity: t.popularity,
                        lyric: lyrics[i],
                        frequency: frequency[i],
                        sentiment: {
                          number: sentiments[i],
                          tag: tag[i]
                        }
                      }
                    })
                  }
                  const res_JSON = {
                    source: "axios",
                    data: res_data
                  }

                  /** store on S3 */
                  const S3_body = JSON.stringify({
                    source: "S3 bucket",
                    data: res_data
                  })
                  const objectParams = {
                    ...S3_params,
                    Body: S3_body
                  }
                  const uploadPromise = new AWS.S3({
                    apiVersion: S3_api_ver
                  }).putObject(objectParams).promise();

                  /** store to Redis */
                  redis_client.setex(redis_key,
                    DEFAULT_REDIS_TIME,
                    JSON.stringify({
                      source: "Redis Cache",
                      data: res_data
                    })
                  )
                  console.log(`serving ${req.body.search} from axios`);
                  res.status(200).send(res_JSON);
                })
            }).catch((err) => {
              console.log(err);
            })
        }
      })
    }
  })
});

module.exports = router;

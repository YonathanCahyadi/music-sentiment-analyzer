import React, { Component } from 'react';
import { Card, Row, Col, Rate, Drawer, Tooltip, Descriptions, Alert, Statistic, Divider, Empty } from 'antd';
import { FrownTwoTone, SmileTwoTone, MehTwoTone } from "@ant-design/icons";
import { ResponsivePie } from '@nivo/pie'
const { Meta } = Card;

function chunk(arr, size) {
    var subArrayCount = arr.length / size;
    var res = [];
    for (let i = 0; i < subArrayCount; i++) {
        var from = size * i;
        var to = (size * (1 + i));
        var sliced = arr.slice(from, to);
        res.push(sliced);
    }
    return res;
}


const MusicMeta = (props) => {

    let sentiment_img = <MehTwoTone twoToneColor="#52c41a" style={{ fontSize: 45 }} />
    if (props.sentiment_tag === "negative") {
        sentiment_img = <FrownTwoTone twoToneColor="#1B8EFA" style={{ fontSize: 45 }} />
    } else if (props.sentiment_tag === "positive") {
        sentiment_img = <SmileTwoTone twoToneColor="#eb2f96" style={{ fontSize: 45 }} />
    }

    return (
        <div>
            <Row gutter={[8, 8]}>
                <Col span={24}>
                    <h4>
                        <a href={props.href}>{props.artist_name}</a>
                    </h4>
                </Col>

            </Row>
            <Row gutter={[8, 8]}>
                <Col span={18}>
                    <Tooltip placement='top' title={props.rate / 5}>
                        <Rate disabled value={props.rate / 5} />
                    </Tooltip>
                </Col>
                <Col span={6}>
                    {sentiment_img}
                </Col>
            </Row>


        </div>
    )
}

const Content = (props) => {

    let sentiment_img_color = "#52c41a";
    let sentiment_img = <MehTwoTone twoToneColor="#52c41a" style={{ fontSize: 50 }} />
    if (props.sentiment_tag === "negative") {
        sentiment_img_color = "#1B8EFA";
        sentiment_img = <FrownTwoTone twoToneColor="#1B8EFA" style={{ fontSize: 50 }} />
    } else if (props.sentiment_tag === "positive") {
        sentiment_img_color = "#eb2f96";
        sentiment_img = <SmileTwoTone twoToneColor="#eb2f96" style={{ fontSize: 50 }} />
    }

    let value = 0;
    if (props.sentiment_tag === "neutral") {
        value = 100;
    } else {
        let n = Math.abs(props.sentiment_number) * 100
        if (n > 100) {
            value = 100;
        } else {
            value = n;
        }
    }

    /** map the graph */
    let graph = [];

    console.log(props
        .frequency);

    if (props.frequency) {
        graph = props.frequency.map((obj) => { return { "id": Object.keys(obj), "label": Object.keys(obj), "value": Object.values(obj) } })

    }

    console.log(graph);

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Descriptions bordered>
                        <Descriptions.Item key="title" label="Title">{props.song_title}</Descriptions.Item>
                        <Descriptions.Item key="song_url" label="Song Url">
                            <a href={props.song_url}>{props.song_url}</a>
                        </Descriptions.Item>
                        <Descriptions.Item key="sentiment" label="Sentiment Value" >
                            <Statistic
                                title={props.sentiment_tag}
                                value={value}
                                precision={2}
                                valueStyle={{ color: sentiment_img_color }}
                                prefix={sentiment_img}
                                suffix="%"
                            />
                        </Descriptions.Item>
                        <Descriptions.Item key="artist" label="Artist">
                            {props.artist_name}
                        </Descriptions.Item>
                        <Descriptions.Item key="preview" label="Preview">
                            {(props.song_preview) ?
                                <audio controls style={{ width: "100%" }}>
                                    <source src={props.song_preview} type="audio/mpeg" />
                                </audio> :
                                <Alert message="Sorry, preview song is not available" type="info" />}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Divider type="horizontal" orientation="left" plain><h3>Lyric</h3></Divider>
                    {(props.lyric) ?
                        <p>{props.lyric}</p> :
                        <Empty
                            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                            imageStyle={{
                                height: 150
                            }}
                            description={
                                <span>
                                    Sorry, lyric for this song is not available
                                </span>
                            }
                        />
                    }
                </Col>
                <Col span={12}>
                    <Divider type="horizontal" orientation="left" plain><h3>Top 10 Words</h3></Divider>
                    {(graph.length !== 0) ?
                        <div style={{ width: "50vw", height: "50vh" }}>
                            <ResponsivePie
                                data={graph}
                                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                innerRadius={0.5}
                                padAngle={0.7}
                                cornerRadius={3}
                            />
                        </div> : <Empty
                            image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                            imageStyle={{
                                height: 150
                            }}
                            description={
                                <span>
                                    Sorry, graph for this song is not available
                                </span>
                            }
                        />

                    }
                </Col>
            </Row>


        </div >
    )
}

export default class MusicSegment extends Component {

    state = {
        arr: [],
        grid: [],
        music_info: null,
        visible: false
    }

    constructor() {
        super();
        this.mapMusic = this.mapMusic.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    componentDidMount() {
        this.mapMusic(this.props.data);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data !== this.props.data) {
            this.mapMusic(this.props.data);
        }
    }

    handleClick(key) {

        let keys = key.toString().split(',');
        if (keys !== "[object Object]") { /** dont pass the class elements */
            console.log(keys)
            let selected = this.state.arr[keys[0]][keys[1]];
            let content_template = < Content
                song_title={selected.song_title}
                song_preview={selected.preview_url}
                artist_name={selected.artists_name}
                song_url={selected.song_url}
                lyric={selected.lyric}
                sentiment_number={selected.sentiment.number}
                sentiment_tag={selected.sentiment.tag}
                frequency={selected.frequency}

            />

            this.setState({
                visible: true,
                music_info: content_template
            })
        }

    }

    onClose() {
        this.setState({
            visible: false
        })
    }

    mapMusic(data) {
        /** split the array in to 2 dimensional array */
        let arr = chunk(data, 6);
        console.log(arr);
        /** map the col */
        let col_html = [];
        for (let i = 0; i < arr.length; i++) {
            let col = [];
            for (let j = 0; j < arr[i].length; j++) {
                col.push(
                    <Col span={4}>

                        <Card
                            cover={<img alt={arr[i][j].song_title} src={arr[i][j].track_images} />}
                            hoverable
                            key={`${i},${j}`}
                            onClick={() => this.handleClick(`${i},${j}`)}
                        >
                            <Meta
                                title={
                                    <Tooltip placement="top" title={arr[i][j].song_title}>
                                        <h3>{arr[i][j].song_title}</h3>
                                    </Tooltip>
                                }
                                description={
                                    <MusicMeta
                                        rate={arr[i][j].popularity}
                                        artist_name={arr[i][j].artists_name}
                                        href={arr[i][j].artists_url}
                                        sentiment_tag={arr[i][j].sentiment.tag}
                                    />
                                }
                            />
                        </Card>

                    </Col>
                )
            }
            col_html.push(col);

        }

        /** map the col html with the Row */
        let grid = col_html.map((col) => {
            return <Row gutter={[16, 16]}>{col}</Row>
        })

        this.setState({
            arr: arr,
            grid: grid
        })
    }


    render() {
        return (
            <div clasname="music-segment">
                {this.state.grid}
                <Drawer
                    height={800}
                    title="Music Info"
                    placement="bottom"
                    closable={true}
                    onClose={this.onClose}
                    visible={this.state.visible}
                    key="bottom"
                >
                    {this.state.music_info}
                </Drawer>
            </div>
        )
    }
}
import React, { Component } from 'react';
import Login from './components/Login';
import Home from './components/Home';
import './App.css';

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || "41fbb2974a1f44cd8bf9df05eca5241f";
const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || "http://localhost:3000";

// Get the hash of the url
const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function(initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});

window.location.hash = "";

class App extends Component {

  state = {
    access_token: null
  }
  
  componentDidMount(){
    /** set the token */
    let _token = hash.access_token || sessionStorage.getItem("access_token");
    if(_token){
      sessionStorage.setItem("access_token", _token);
      this.setState({
        access_token: _token
      })
    }
  }

  render(){
    return (
      <div className="app-container">
        {(this.state.access_token) ? <Home access_token={this.state.access_token} /> : <Login client_id={CLIENT_ID} redirect_url={CLIENT_URL}/>}
      </div>
    )
  };
}

export default App;

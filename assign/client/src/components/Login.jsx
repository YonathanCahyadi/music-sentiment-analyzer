import React, { Component } from 'react'
import { Row, Col, Button } from 'antd'
import SpotifyImg from '../rsc/spotify.png'

export default class Login extends Component {
    render() {
        return (
            <div>
                <div className="login-container" style={{ height: "100vh" }}>
                    <Row gutter={[8, 226]}>
                        <Col span={24}>
                            <img alt="spotify.png" className="App-logo" src={SpotifyImg} width={200} height={200} />
                            <h1 style={{ color: 'white', fontSize: '50px', fontWeight: 'bold' }}>
                                Music Sentiment Analyzer</h1>
                            <h4 style={{ color: 'whitesmoke', fontStyle: 'italic' }}>
                                please login spotify account for more access</h4>
                        </Col>
                    </Row>
                    <Row gutter={[8, 16]}>
                        <Col span={24}>
                            <Button
                                type='Button'
                                ghost
                                shape='round'
                                size='medium'
                                href={`https://accounts.spotify.com/authorize?client_id=${this.props.client_id}&response_type=token&redirect_uri=${this.props.redirect_url}&show_dialog=true`}>
                                Login Spotify
                        </Button>
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}

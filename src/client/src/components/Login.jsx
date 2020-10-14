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
                            <img alt="spotify.png" src={SpotifyImg} width={600} height={200}/>
                        </Col>
                    </Row>
                    <Row gutter={[8, 16]}>
                        <Col span={24}>
                            <Button
                                color='#fff7e6'
                                type='Button'
                                ghost
                                size='medium'
                                href={`https://accounts.spotify.com/authorize?client_id=${this.props.client_id}&response_type=token&redirect_uri=${this.props.redirect_url}&show_dialog=true`}>
                                Login
                        </Button>
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }
}

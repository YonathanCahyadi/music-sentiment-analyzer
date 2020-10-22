import React, { Component } from 'react'
import { Layout, Input, Row, Col, Empty, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import MusicSegment from './MusicSegment';
import './Home.css'

const axios = require('axios').default;
const { Header, Footer, Content } = Layout;
const { Search } = Input;
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:443";

// Check invalid input
function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null;
}

// Home page functions
export default class Home extends Component {
    state = {
        data: null,
        loading: false
    }

    constructor() {
        super();
        this.getMusic = this.getMusic.bind(this);
        this.search = this.search.bind(this);
    }

    componentDidMount() {
        this.getMusic(null, this.state.selected_type);
    }

    // Fetch user's spotify data based on user input
    getMusic(value) {
        this.setState({
            loading: true
        }, () => {
            axios.post(`${SERVER_URL}/api/music`, {
                access_token: this.props.access_token,
                search: value
            }).then(({ data }) => { /** process the data */
                console.log(data);
                if (data.data.length === 0) {
                    this.setState({
                        data: null,
                        loading: false
                    })
                } else {
                    this.setState({
                        data: data.data,
                        loading: false
                    })
                }
            })
        })
    }

    // Search function: check unser input if there is no invalid input will fecth data from spotify
    search(value) {
        if (isEmptyOrSpaces(value)) {
            this.getMusic(null);
        } else {
            this.getMusic(value);
        }
    }

    // Render the page with ANTD node package
    render() {
        return (
            <Layout>
                <Header style={{ position: 'fixed', zIndex: 1, width: '100%', backgroundColor: '#edf0f2' }}>
                    <Row style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <Col span={3}>
                            <h1 style={{ color: '#022605' }}>Music Analyzer</h1>
                        </Col>

                        <Col span={17}>
                            <Search
                                style={{ width: "70%", marginTop: 10 }}
                                size='large'
                                placeholder="search"
                                enterButton
                                onSearch={this.search}
                            />

                        </Col>
                        <Col span={4}>
                            <Button
                                href='https://www.spotify.com/logout/'
                                type="primary"
                                ghost
                                shape='round'
                            > Logout</Button>
                        </Col>

                    </Row>
                </Header>
                <Content
                    className="site-layout"
                    style={{ padding: '0 50px', marginTop: 64, backgroundColor: '#efedf2' }}
                >
                    {(!this.state.loading) ? ((this.state.data) ? <MusicSegment data={this.state.data} /> : <Empty />) : <LoadingOutlined id="loading" style={{ fontSize: 50 }} spin />}
                </Content>
                <Footer
                    style={{ textAlign: 'center', backgroundColor: '#2c3b45', color: '#e4ebf0' }}>Ant Design ©2018 Created by Ant UED
                </Footer>
            </Layout >
        )
    }
}

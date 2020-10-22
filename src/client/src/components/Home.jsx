import React, { Component } from 'react'
import { Layout, Input, Row, Col, Empty } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import MusicSegment from './MusicSegment';
import './Home.css'

const axios = require('axios').default;
const { Header, Footer, Content } = Layout;
const { Search } = Input;
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:443";

function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null;
}

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

    search(value) {
        if (isEmptyOrSpaces(value)) {
            this.getMusic(null);
        } else {
            this.getMusic(value);
        }
    }


    render() {
        return (
            <Layout>
                <Header style={{ position: 'fixed', zIndex: 1, width: '100%', backgroundColor: '#edf0f2' }}>
                    <Row gutter={[8, 26]} style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <Col span={3}>
                            <h1 style={{ color: '#2c3b45' }}>Music Analyzer</h1>
                        </Col>
                        <Col span={19}>
                            <Search
                                style={{ width: "100%", marginTop: 10 }}
                                size='large'
                                placeholder="search"
                                enterButton
                                onSearch={this.search}
                            />
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
            </Layout>
        )
    }
}

import React, {Component} from 'react';
import axios from 'axios';
import Card from "./Card";
import PubSub from 'pubsub-js';
import BounceLoader from "react-spinners/BounceLoader";
import MediaQuery from 'react-responsive';

export default class News extends Component {
    state = {
        news_data:[],
        isLoading: true,
        isGuardian: true,
        headerSection: 'Home'
    };

    componentDidMount() {
        PubSub.subscribe('startLoading', (msg, {isLoading}) => {
            this.setState({isLoading});
        });
        PubSub.subscribe('updateNewsState', (msg, {news_data, headerSection, isGuardian}) => {
            this.setState({isLoading:false, news_data, headerSection, isGuardian});
        });
        PubSub.subscribe('switchNews', (msg, {isGuardian}) => {
            this.setState({isGuardian:isGuardian});
        });

        // only the first time to execute default search ('/home'), i.e. open browser
        // after that, get News component by subscribing call back
        let routerState = this.props.location.state;
        if (!routerState) {
            axios.get('/home')
                .then((response) => {
                    let data = JSON.parse(JSON.stringify(response.data));
                    if (data['status'] === 'ok') {
                        this.setState({isLoading:false, news_data:data['data']});
                    }
                })
                .catch((err) => {
                    console.log("err: " + err.toString())
                });
        }
    }

    componentWillUnmount() {
        PubSub.unsubscribe("startLoading");
        PubSub.unsubscribe("updateNewsState");
        PubSub.unsubscribe("switchNews");
    }

    render() {
        let {news_data, isLoading, isGuardian, headerSection} = this.state;

        if (isLoading === true) {
            return (
                <MediaQuery minDeviceWidth={992} >
                    <div className="loading">
                        <div id="loading_icon">
                            <BounceLoader size={50} color={"#334ebc"}/>
                        </div>
                        <span id="loading_word">Loading</span>
                    </div>
                </MediaQuery>
            )
        } else {
            return (
                <div>
                    {
                        news_data.map((item) => {
                            return <Card key={item.id} isGuardian={isGuardian} headerSection={headerSection} {...item}/>
                        })
                    }
                </div>
            )
        }
    }
}
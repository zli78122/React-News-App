import React, {Component} from 'react';
import PubSub from 'pubsub-js';
import './Result.css';
import axios from "axios";
import ResultCard from './ResultCard'

export default class Result extends Component {
    state = {
        news_data:[],
        isGuardian: true
    };

    newsNumber = 0;
    loadedNews = 0;
    allLoaded = false;
    newsHeight = [];

    componentDidMount() {
        PubSub.publish('showSwitch',{showSwitch:false});

        let url = '';
        let outerIsGuardian = true;
        let routeState = this.props.history.location.state;
        if (routeState) {
            let {keyword, isGuardian} = routeState;
            if (isGuardian) {
                url = `/searchByKeyword?q=${keyword}`;
            } else {
                url = `/nySearchByKeyword?q=${keyword}`;
            }
            outerIsGuardian = isGuardian;
        } else {
            let {search} = this.props.history.location;
            url = `/searchByKeyword${search}`;
        }
        axios.get(url)
            .then((response) => {
                let data = JSON.parse(JSON.stringify(response.data));
                if (data['status'] === 'ok') {
                    this.newsNumber = data['data'].length;
                    this.loadedNews = 0;
                    this.allLoaded = false;
                    this.newsHeight = [];
                    this.setState({news_data:data['data'], isGuardian:outerIsGuardian});
                }
            })
            .catch((err) => {
                console.log("err: " + err.toString())
            });

        // the subscription is called when users use search box and currently the page is in Results page
        PubSub.subscribe('inResultPage', (msg, {isGuardian, keyword}) => {
            let url = '';
            if (isGuardian) {
                url = `/searchByKeyword?q=${keyword}`;
            } else {
                url = `/nySearchByKeyword?q=${keyword}`;
            }
            axios.get(url)
                .then((response) => {
                    let data = JSON.parse(JSON.stringify(response.data));
                    if (data['status'] === 'ok') {
                        this.newsNumber = data['data'].length;
                        this.loadedNews = 0;
                        this.allLoaded = false;
                        this.newsHeight = [];
                        this.setState({news_data:data['data'], isGuardian});
                    }
                })
                .catch((err) => {
                    console.log("err: " + err.toString())
                });
        });

        PubSub.subscribe('loadedImage', (msg, {index, height}) => {
            this.loadedNews++;
            this.newsHeight[index] = height;
            if (this.newsNumber === this.loadedNews) {
                this.allLoaded = true;
                for (let i = 0; i < this.newsNumber; i += 4) {
                    let tmpHeight = 0;
                    for (let j = i; j <= i + 3; j++) {
                        if (j < this.newsNumber) {
                            tmpHeight = Math.max(tmpHeight, this.newsHeight[j]);
                        }
                    }
                    for (let j = i; j <= i + 3; j++) {
                        if (j < this.newsNumber) {
                            this.newsHeight[j] = tmpHeight;
                        }
                    }
                }
                let newsTops = [];
                let currTop = 0;
                for (let i = 0; i < this.newsNumber; i += 4) {
                    for (let j = i; j <= i + 3; j++) {
                        if (j < this.newsNumber) {
                            newsTops[j] = currTop;
                        }
                    }
                    currTop += (this.newsHeight[i] + 15);
                }
                PubSub.publish('showFinalPosition',{newsTops});
            }
        });
    }

    componentWillUnmount() {
        PubSub.publish('clearAutoCompletion',{});
        PubSub.publish('outResultPage',{});
        PubSub.publish('showSwitch',{showSwitch:true});

        PubSub.unsubscribe("inResultPage");
        PubSub.unsubscribe("loadedImage");
    }

    render() {
        let {news_data, isGuardian} = this.state;
        let documentWidth = document.documentElement.clientWidth;
        let inMobile = documentWidth < 992;

        return (
            <div>
                <div className="results_title" style={{margin: inMobile ? '-22px 0 5px 4.98%' : '-22px 0 5px 2.08%'}}>Results</div>
                <div className="results_container" style={{margin: inMobile ? '0 4.98%' : '0'}}>
                    {
                        news_data.map((item, index) => {
                            return <ResultCard key={item.id} index={index} isGuardian={isGuardian} {...item}/>
                        })
                    }
                </div>
            </div>
        )
    }
}
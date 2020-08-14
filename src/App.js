import React, {Component} from 'react';
import Header from "./components/header/Header";
import {Container} from "react-bootstrap";
import './App.css';
import News from "./components/news-card/News";
import {Route,Redirect,Switch} from 'react-router-dom'
import Article from "./components/article/Article";
import Result from "./components/result/Result"
import Favorites from "./components/favorites/Favorites";

export default class App extends Component {
    state = {
        documentWidth: 1680
    };

    timer = undefined;

    componentDidMount() {
        this.timer = setInterval(() => {
            let curWidth = document.documentElement.clientWidth;
            if (curWidth !== this.state.documentWidth) {
                this.setState({documentWidth:curWidth});
            }
        }, 10);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    render() {
        return (
            <div>
                <Container fluid>
                    <Header/>
                    <Switch>
                        <Route path='/favorites' component={Favorites}/>
                        <Route path='/article' component={Article}/>
                        <Route path='/search' component={Result}/>
                        <Route path='/' component={News} exact/>
                        <Route path='/World' component={News}/>
                        <Route path='/Politics' component={News}/>
                        <Route path='/Business' component={News}/>
                        <Route path='/Technology' component={News}/>
                        <Route path='/Sports' component={News}/>

                        <Redirect to='/'/>
                    </Switch>
                </Container>
            </div>
        )
    }
}
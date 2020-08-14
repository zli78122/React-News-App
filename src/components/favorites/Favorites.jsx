import React, {Component} from 'react';
import PubSub from 'pubsub-js';
import './Favorites.css';
import FavoritesCard from './FavoritesCard';

export default class Favorites extends Component {

    state = {
        news_data:[],
        updateAfterDelete: false,
        topsAfterDelete: []
    };

    newsNumber = 0;
    loadedNews = 0;
    allLoaded = false;
    newsHeight = [];
    oriNewsHeight = [];

    componentDidMount() {
        PubSub.publish('showSwitch',{showSwitch:false});

        let local_storage = window.localStorage;
        if (!local_storage.getItem('Bookmarks')) {
            local_storage.setItem('Bookmarks', JSON.stringify([]));
        }
        let bookmarks = JSON.parse(local_storage.getItem('Bookmarks'));
        let {news_data} = this.state;
        for (let i = 0; i < bookmarks.length; i++) {
            news_data.push(bookmarks[i]);
        }
        this.newsNumber = news_data.length;
        this.loadedNews = 0;
        this.allLoaded = false;
        this.newsHeight = [];
        this.setState({news_data});

        PubSub.subscribe('loadedBookmarkImage', (msg, {index, height}) => {
            this.loadedNews++;
            this.oriNewsHeight[index] = height;
            if (this.newsNumber === this.loadedNews) {
                this.allLoaded = true;
                for (let i = 0; i < this.newsNumber; i += 4) {
                    let tmpHeight = 0;
                    for (let j = i; j <= i + 3; j++) {
                        if (j < this.newsNumber) {
                            tmpHeight = Math.max(tmpHeight, this.oriNewsHeight[j]);
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
                PubSub.publish('showFinalFavoritesPosition',{newsTops});
            }
        });
    }

    componentWillUnmount() {
        PubSub.publish('outBookmarkPage',{});
        PubSub.publish('showSwitch',{showSwitch:true});

        PubSub.unsubscribe("loadedBookmarkImage");
    }

    deleteItem = ({index}) => {
        let local_storage = window.localStorage;
        let bookmarks = JSON.parse(local_storage.getItem('Bookmarks'));
        let news_data = [];
        for (let i = 0; i < bookmarks.length; i++) {
            news_data.push(bookmarks[i]);
        }
        this.newsNumber = news_data.length;
        this.loadedNews = this.newsNumber;
        this.allLoaded = true;
        this.newsHeight = [];

        this.oriNewsHeight.splice(index, 1);
        for (let i = 0; i < this.newsNumber; i += 4) {
            let tmpHeight = 0;
            for (let j = i; j <= i + 3; j++) {
                if (j < this.newsNumber) {
                    tmpHeight = Math.max(tmpHeight, this.oriNewsHeight[j]);
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
        this.setState({news_data, updateAfterDelete: true, topsAfterDelete: newsTops});
    };

    render() {
        let {news_data, updateAfterDelete, topsAfterDelete} = this.state;
        let documentWidth = document.documentElement.clientWidth;
        let inMobile = documentWidth < 992;

        return (
            <div>
                <div className="favorites_title"
                     style={{
                         display: news_data.length === 0 ? 'none' : 'block',
                         margin: inMobile ? '-20px 4.072% 4px' : '-8px 0 5px 1.07%'}
                     }>Favorites
                </div>
                <div className="no_favorites" style={{display: news_data.length === 0 ? 'block' : 'none'}}>
                    You have no saved articles
                </div>
                <div className="favorites_container" style={{margin: inMobile ? '0 4.072%' : '0'}}>
                    {
                        news_data.map((item, index) => {
                            return <FavoritesCard key={item.id}
                                                  index={index}
                                                  updateAfterDelete={updateAfterDelete}
                                                  topsAfterDelete={topsAfterDelete}
                                                  {...item}
                                                  deleteItem={this.deleteItem}/>
                        })
                    }
                </div>
            </div>
        )
    }
}
import React, {Component} from 'react'
import axios from "axios";
import BounceLoader from "react-spinners/BounceLoader";
import './Article.css';
import {MdKeyboardArrowDown, MdKeyboardArrowUp} from 'react-icons/md';
import {FacebookShareButton, FacebookIcon, TwitterShareButton, TwitterIcon, EmailShareButton, EmailIcon} from 'react-share';
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import Comment from "./Comment";
import ReactTooltip from 'react-tooltip';
import { ToastContainer, toast, cssTransition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PubSub from "pubsub-js";
import MediaQuery from 'react-responsive';

const Zoom = cssTransition({
    enter: 'zoomIn',
    exit: 'zoomOut',
    duration: 750,
});

function parseDescription(description) {
    let sentences = ('' + description).split(/\.[\s|\\n]/);
    let description_first = '';
    let description_second = '';
    for (let i = 0; i < sentences.length; i++) {
        if (i <= 3) {
            if (i === sentences.length - 1) {
                description_first += (sentences[i]);
            } else {
                description_first += (sentences[i] + '. ');
            }
        } else {
            if (i === sentences.length - 1) {
                description_second += (sentences[i]);
            } else {
                description_second += (sentences[i] + '. ');
            }
        }
    }
    return {description_first:description_first, description_second:description_second};
}

export default class Article extends Component {
    state = {
        isLoading: true,
        id: '',
        url: '',
        title: '',
        image: '',
        section: '',
        date: '',
        description_first: '',
        description_second: '',
        show_second: false,
        in_bookmark: false,
        isGuardian: true,
        headerSection: ''
    };

    componentDidMount() {
        PubSub.publish('showSwitch',{showSwitch:false});

        // if users visit Article Component by typing the article link in search box directly instead of clicking the Card
        // send request to server to get data by article id
        // otherwise, directly use the data stored in state
        let routeState = this.props.history.location.state;
        if (!routeState) {
            let {search} = this.props.history.location;
            let url = '';
            let isGuardianCheckedById;
            if (search.endsWith('.html') && search.startsWith('?id=https://')) {
                // NYTimes
                url = `/nySearchById${search}`;
                isGuardianCheckedById = false;
            } else {
                // Guardian
                url = `/searchById${search}`;
                isGuardianCheckedById = true;
            }
            axios.get(url)
                .then((response) => {
                    let data = JSON.parse(JSON.stringify(response.data));
                    if (data['status'] === 'ok') {
                        let {id, url, title, image, section, date, description} = data['data'];
                        let {description_first, description_second} = parseDescription(description);
                        this.setState({isLoading: false, id, url, title, image, section, date, description_first, description_second, isGuardian:isGuardianCheckedById});
                    }
                })
                .catch((err) => {
                    console.log("err: " + err.toString())
                });
        } else {
            let {isGuardian, id, title, url, image, section, date, description, headerSection} = this.props.history.location.state;
            let {description_first, description_second} = parseDescription(description);
            setTimeout(() => {
                this.setState({isLoading: false, id, url, title, image, section, date, description_first, description_second, isGuardian, headerSection});
            }, 1000);
        }

        let local_storage = window.localStorage;
        if (!local_storage.getItem('Bookmarks')) {
            local_storage.setItem('Bookmarks', JSON.stringify([]));
        }
        let bookmarks = JSON.parse(local_storage.getItem('Bookmarks'));
        let id = (this.props.history.location.search + '').substring(4);
        for (let i = 0; i < bookmarks.length; i++) {
            if (bookmarks[i]['id'] === id) {
                this.setState({in_bookmark:true});
                break;
            }
        }
    }

    componentWillUnmount() {
        PubSub.publish('showSwitch',{showSwitch:true});
    }

    arrowDownClick = () => {
        let show_second = !this.state.show_second;
        this.setState({show_second});
        if (show_second) {
            setTimeout(() => {
                let second_paragraph = document.getElementById('second_paragraph');
                window.scrollTo({top: second_paragraph.offsetTop - 115, left: 0, behavior: 'smooth' });
            }, 20);
        } else {
            setTimeout(() => {
                window.scrollTo({top: 0, left: 0, behavior: 'smooth' });
            }, 20);
        }
    };

    clickBookMark = () => {
        let local_storage = window.localStorage;
        let bookmarks = JSON.parse(local_storage.getItem('Bookmarks'));

        let {in_bookmark, title} = this.state;
        if (in_bookmark) {
            title = 'Removing - ' + title;
            for (let i = 0; i < bookmarks.length; i++) {
                if (bookmarks[i]['id'] === this.state.id) {
                    bookmarks.splice(i, 1);
                    break;
                }
            }
        } else {
            let {isGuardian, id, title, url, image, section, date, description_first, description_second} = this.state;
            let description = '';
            if (description_second) {
                description = description_first + ' ' + description_second;
            } else {
                description = description_first;
            }
            bookmarks.push({isGuardian, id, title, url, image, section, date, description, headerSection:'_Bookmarks'});
        }
        local_storage.setItem('Bookmarks', JSON.stringify(bookmarks));

        toast(title, {
            transition: Zoom,
            autoClose: 2000,
            hideProgressBar: true
        });
        in_bookmark = !in_bookmark;
        this.setState({in_bookmark});
    };

    render() {
        let {isLoading, id, url, title, image, date, description_first, description_second, show_second, in_bookmark} = this.state;
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
                    <div className="article_show">
                        <div className="article_title">{title}</div>
                        <div className="article_date_share_bookmark">
                            <span className="article_date">{date}</span>
                            <span className="article_share_button">
                                <p data-tip="Facebook" data-for="article_tooltip" className="article_tooltip">
                                    <FacebookShareButton url={url} hashtag="#CSCI_571_NewsApp" className="article_facebook">
                                        <FacebookIcon size={35} round={true}/>
                                    </FacebookShareButton>
                                </p>
                                <p data-tip="Twitter" data-for="article_tooltip" className="article_tooltip">
                                    <TwitterShareButton url={url} hashtags={["CSCI_571_NewsApp"]} className="article_twitter">
                                        <TwitterIcon size={35} round={true}/>
                                    </TwitterShareButton>
                                </p>
                                <p data-tip="Email" data-for="article_tooltip" className="article_tooltip">
                                    <EmailShareButton url={url} subject="#CSCI_571_NewsApp" className="article_email">
                                        <EmailIcon size={35} round={true}/>
                                    </EmailShareButton>
                                </p>
                                <ReactTooltip id="article_tooltip"/>
                            </span>
                            <span onClick={this.clickBookMark} data-tip="Bookmark" data-for="article_tooltip" className="article_bookmark_container">
                                <FaRegBookmark style={{display: in_bookmark === false ? 'inline-block' : 'none'}} className="article_bookmark"/>
                                <FaBookmark style={{display: in_bookmark === true ? 'inline-block' : 'none'}} className="article_bookmark"/>
                                <ToastContainer position={toast.POSITION.TOP_CENTER} toastClassName='toast_container' bodyClassName='toast_body'/>
                            </span>
                        </div>
                        <div className="article_img_container">
                            <img src={image} className="article_img" alt=""/>
                        </div>
                        <div className="article_desc" id="first_paragraph">{description_first}</div>
                        <div style={{display: show_second === false ? 'none' : 'block'}} className="article_desc" id="second_paragraph">{description_second}</div>
                        <div className="article_arrow_container" onClick={this.arrowDownClick} style={{display: description_second === '' ? 'none' : 'block'}}>
                            <MdKeyboardArrowDown style={{display: show_second === true ? 'none' : 'block'}} className="article_arrow"/>
                            <MdKeyboardArrowUp style={{display: show_second === false ? 'none' : 'block'}} className="article_arrow"/>
                        </div>
                    </div>
                    <Comment id={id}/>
                </div>
            )
        }
    }
}
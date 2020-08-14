import React, {Component, useState} from 'react';
import './Result.css';
import {Badge, Modal} from "react-bootstrap";
import {EmailIcon, EmailShareButton, FacebookIcon, FacebookShareButton, TwitterIcon, TwitterShareButton} from "react-share";
import {IoMdShare} from 'react-icons/io';
import {withRouter} from 'react-router-dom';
import PubSub from 'pubsub-js';
import MediaQuery from 'react-responsive';

class ResultCard extends Component {

    state = {
        allLoaded: false,
        newsTop: 0
    };

    clickShareButton = (event) => {
        event.stopPropagation();
    };

    clickArticle = (id) => {
        let {isGuardian, title, url, image, section, date, description, headerSection} = this.props;
        this.props.history.push({
            pathname:'/article',
            search:`?id=${id}`,
            state:{isGuardian, id, title, url, image, section, date, description, headerSection}
        });
    };

    imageLoaded = () => {
        let {index} = this.props;
        let height = document.getElementById(this.props.id).clientHeight;
        PubSub.publish('loadedImage',{index, height});
    };

    componentDidMount() {
        PubSub.subscribe('showFinalPosition', (msg, {newsTops}) => {
            let {index} = this.props;
            this.setState({allLoaded:true, newsTop:newsTops[index]});
        });
    }

    componentWillUnmount() {
        PubSub.unsubscribe("showFinalPosition");
    }

    render() {
        let {allLoaded, newsTop} = this.state;

        let {id, title, url, image, section, date, index} = this.props;
        let variant = '';
        let className = '';
        if (section === 'SPORT' || section === 'SPORTS') {
            variant = 'warning';
        } else if (section === 'WORLD') {
            variant = 'primary';
            className = 'world';
        } else if (section === 'POLITICS') {
            variant = 'info';
        } else if (section === 'BUSINESS') {
            variant = 'primary';
        } else if (section === 'TECHNOLOGY') {
            variant = 'warning';
            className = 'technology';
        } else {
            variant = 'secondary';
        }

        let showTitle = title;
        let splitTitle = ('' + title).split(' ');
        if (splitTitle.length > 10) {
            let tmp = '';
            for (let i = 0; i < 10; i++) {
                tmp += (splitTitle[i] + ' ');
            }
            showTitle = tmp.substring(0, tmp.length - 1) + '...';
        }

        let documentWidth = document.documentElement.clientWidth;
        let position, inMobile;
        if (documentWidth < 992) {
            inMobile = true;
            position = 'static';
        } else {
            inMobile = false;
            position = 'absolute';
        }

        let newsWidth, newsMarginLeft, left, top;
        if (!inMobile) {
            newsWidth = documentWidth * 0.22381;
            newsMarginLeft = documentWidth * 0.0208;
            let offsetX = index % 4;
            let offsetY = Math.floor(index / 4);
            left = offsetX * (newsWidth + newsMarginLeft);
            if (!allLoaded) {
                top = offsetY * (15 + newsWidth);
            } else {
                top = newsTop;
            }
        } else {
            newsWidth = '100%';
            newsMarginLeft = 0;
        }

        return (
            <div id={id} className="result_news"
                 onClick={() => {return this.clickArticle(id)}}
                 style={{position: position, width: newsWidth, marginLeft: newsMarginLeft, left: left, top:top}}>
                <span>
                    <span className="result_card_title">
                        {showTitle}
                    </span>
                    <span onClick={(event) => this.clickShareButton(event)}>
                        <PopupInResult title={title} url={url}/>
                    </span>
                </span>
                <div>
                    <img className="result_card_img" src={image} alt="" onLoad={this.imageLoaded}/>
                </div>
                <div className="result_card_other">
                    <span className="date">{date}</span>
                    <Badge pill variant={variant} className={'category ' + className} id="result_section">{section}</Badge>
                </div>
            </div>
        )
    }
}

function PopupInResult(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    let {title, url} = props;
    return (
        <>
            <IoMdShare className="result_card_share" onClick={handleShow}/>

            <Modal show={show} onHide={handleClose} >
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="share_via">Share via</div>
                    <div className='share_button'>
                        <MediaQuery minDeviceWidth={992} >
                            <FacebookShareButton url={url} hashtag="#CSCI_571_NewsApp" className="facebook">
                                <FacebookIcon size={70} round={true}/>
                            </FacebookShareButton>
                            <TwitterShareButton url={url} hashtags={["CSCI_571_NewsApp"]} style={{margin: '0 123px'}}>
                                <TwitterIcon size={70} round={true}/>
                            </TwitterShareButton>
                            <EmailShareButton url={url} subject="#CSCI_571_NewsApp" className="email">
                                <EmailIcon size={70} round={true}/>
                            </EmailShareButton>
                        </MediaQuery>
                        <MediaQuery maxDeviceWidth={992} >
                            <FacebookShareButton url={url} hashtag="#CSCI_571_NewsApp" className="facebook">
                                <FacebookIcon size={68} round={true}/>
                            </FacebookShareButton>
                            <TwitterShareButton url={url} hashtags={["CSCI_571_NewsApp"]} style={{margin: '0 16.6%'}}>
                                <TwitterIcon size={68} round={true}/>
                            </TwitterShareButton>
                            <EmailShareButton url={url} subject="#CSCI_571_NewsApp" className="email">
                                <EmailIcon size={68} round={true}/>
                            </EmailShareButton>
                        </MediaQuery>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default withRouter(ResultCard);
import React, {Component, useState} from 'react';
import {Modal, Badge} from "react-bootstrap";
import {EmailIcon, EmailShareButton, FacebookIcon, FacebookShareButton, TwitterIcon, TwitterShareButton} from "react-share";
import {IoMdShare} from 'react-icons/io';
import {withRouter} from 'react-router-dom';
import {IoMdTrash} from 'react-icons/io';
import PubSub from 'pubsub-js';
import MediaQuery from 'react-responsive';

class FavoritesCard extends Component {

    state = {
        allLoaded: false,
        newsTops: []
    };

    clickArticle = (id) => {
        let {isGuardian, title, url, image, section, date, description, headerSection} = this.props;
        this.props.history.push({
            pathname:'/article',
            search:`?id=${id}`,
            state:{isGuardian, id, title, url, image, section, date, description, headerSection}
        });
    };

    clickShareButton = (event) => {
        event.stopPropagation();
    };

    clickTrashButton = (event) => {
        event.stopPropagation();
    };

    deleteArticle = (id) => {
        let local_storage = window.localStorage;
        let bookmarks = JSON.parse(local_storage.getItem('Bookmarks'));
        for (let i = 0; i < bookmarks.length; i++) {
            if (bookmarks[i]['id'] === id) {
                bookmarks.splice(i, 1);
                break;
            }
        }
        local_storage.setItem('Bookmarks', JSON.stringify(bookmarks));
        this.props.deleteItem({index:this.props.index});
    };

    imageLoaded = () => {
        let {index} = this.props;
        let height = document.getElementById(this.props.id).clientHeight;
        PubSub.publish('loadedBookmarkImage',{index, height});
    };

    componentDidMount() {
        PubSub.subscribe('showFinalFavoritesPosition', (msg, {newsTops}) => {
            this.setState({allLoaded:true, newsTops:newsTops});
        });
    }

    componentWillUnmount() {
        PubSub.unsubscribe("showFinalFavoritesPosition");
    }

    render() {
        let {allLoaded, newsTops} = this.state;

        let {index, isGuardian, id, title, url, image, section, date} = this.props;
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

        let newspaper = isGuardian ? 'GUARDIAN' : 'NYTIMES';
        let newspaperClass;
        let newspaperVariant;
        if (newspaper === 'GUARDIAN') {
            newspaperVariant = 'primary';
            newspaperClass = 'newspaper_guardian';
        } else {
            newspaperVariant = 'warning';
            newspaperClass = 'newspaper_nytimes';
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
            if (index % 4 === 0) {
                newsMarginLeft = documentWidth * 0.0119;
            } else {
                newsMarginLeft = documentWidth * 0.0208;
            }
            let offsetX = index % 4;
            if (offsetX === 0) {
                left = 0;
            } else {
                left = offsetX * newsWidth + (offsetX - 1) * documentWidth * 0.0208 + documentWidth * 0.0119;
            }
            let offsetY = Math.floor(index / 4);
            if (!allLoaded) {
                top = offsetY * (15 + newsWidth);
            } else {
                let {updateAfterDelete, topsAfterDelete} = this.props;
                if (updateAfterDelete) {
                    top = topsAfterDelete[index];
                } else {
                    top = newsTops[index];
                }
            }
        } else {
            newsWidth = '100%';
            newsMarginLeft = 0;
        }

        return (
            <div id={id} className="favorites_news"
                 onClick={() => {return this.clickArticle(id)}}
                 style={{position: position, width: newsWidth, marginLeft: newsMarginLeft, left: left, top:top}} >
                <span>
                    <span className="favorites_card_title">
                        {showTitle}
                    </span>
                    <span onClick={(event) => this.clickShareButton(event)}>
                        <PopupInResult title={title} url={url}/>
                    </span>
                    <span onClick={(event) => this.clickTrashButton(event)}>
                        <IoMdTrash onClick={() => {return this.deleteArticle(id)}} className="favorites_trash"/>
                    </span>
                </span>
                <div>
                    <img className="favorites_card_img" src={image} alt="" onLoad={this.imageLoaded}/>
                </div>
                <div className="favorites_card_other">
                    <span className="date">{date}</span>
                    <Badge pill variant={newspaperVariant} className={'newspaper ' + newspaperClass} id="favorite_section">{newspaper}</Badge>
                    <Badge pill variant={variant} className={'category ' + className} id="favorite_newspaper">{section}</Badge>
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
            <IoMdShare className="favorites_card_share" onClick={handleShow}/>

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

export default withRouter(FavoritesCard);
import React, {Component, useState,} from 'react';
import './News.css';
import {Badge, Modal} from "react-bootstrap";
import {IoMdShare} from 'react-icons/io';
import {FacebookShareButton, FacebookIcon, TwitterShareButton, TwitterIcon, EmailShareButton, EmailIcon} from 'react-share';
import './Card.css';
import {withRouter} from 'react-router-dom';
import MediaQuery from 'react-responsive';

class Card extends Component {
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

    render() {
        let {id, title, url, image, section, date, description} = this.props;
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

        let documentWidth = document.documentElement.clientWidth;
        let inMobile = documentWidth < 992;

        return (
            <div>
                <div className="news_card_container" onClick={() => {return this.clickArticle(id)}}>
                    <img className="news_card_img" style={{width: inMobile ? '100%' : '365px'}} src={image} alt="" />
                    <div className="news_card_div">
                        <div className="news_card_title">
                            {title}
                            <span onClick={(event) => this.clickShareButton(event)}>
                                <Popup title={title} url={url}/>
                            </span>
                        </div>
                        <div className="news_card_content">{description}</div>
                        <div className="news_card_other">
                            <span className="date">{date}</span>
                            <Badge pill variant={variant} className={'category ' + className}>{section}</Badge>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

function Popup(props) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    let {title, url} = props;
    return (
        <>
            <IoMdShare onClick={handleShow}/>

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

export default withRouter(Card);
import React, {Component} from 'react';
import { Nav, Navbar} from "react-bootstrap";
import AsyncSelect from 'react-select/async';
import './Header.css';
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import Switch from "react-switch";
import {NavLink} from 'react-router-dom'
import axios from "axios";
import PubSub from 'pubsub-js';
import {withRouter} from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import MediaQuery from "react-responsive";

class Header extends Component {

    state = {
        checked: true, // true: Guardian, false: NYTimes
        targetSection: 'Home',
        showSwitch: true,
        selectedOption: null,
        inResultPage: false,
        inBookmarkPage: false
    };

    componentDidMount() {
        PubSub.subscribe('showSwitch', (msg, {showSwitch}) => {
            this.setState({showSwitch});
        });
        PubSub.subscribe('clearAutoCompletion', () => {
            this.setState({selectedOption:null});
        });
        PubSub.subscribe('outResultPage', () => {
            this.setState({inResultPage:false});
        });
        PubSub.subscribe('outBookmarkPage', () => {
            this.setState({inBookmarkPage:false});
        });
    }

    componentWillUnmount() {
        PubSub.unsubscribe("showSwitch");
        PubSub.unsubscribe("clearAutoCompletion");
        PubSub.unsubscribe("outResultPage");
        PubSub.unsubscribe("outBookmarkPage");
    }

    changeSwitch = () => {
        let checked =  !this.state.checked;

        let url = '';
        if (checked) { // Guardian
            url = '/home';
            PubSub.publish('switchNews',{isGuardian:true});
        } else { // NYTimes
            url = '/nyHome';
            PubSub.publish('switchNews',{isGuardian:false});
        }
        PubSub.publish('startLoading',{isLoading:true});
        axios.get(url)
            .then((response) => {
                let data = JSON.parse(JSON.stringify(response.data));
                if (data['status'] === 'ok') {
                    PubSub.publish('updateNewsState',{news_data:data['data'], headerSection:'Home', isGuardian:checked});
                }
            })
            .catch((err) => {
                console.log("err: " + err.toString())
            });

        this.setState({checked, targetSection: 'Home'});
    };

    clickSection = (target) => {
        let headerSection = target;
        let checked =  this.state.checked;

        this.setState({targetSection:target});
        PubSub.publish('startLoading',{isLoading:true});

        let url;
        if (checked) {
            if (target !== 'Home') {
                target = target.toLowerCase();
                url = `/section?section=${target}`;
            } else {
                url = '/home';
            }
        } else {
            if (target !== 'Home') {
                target = target.toLowerCase();
                target = target === 'sport' ? 'sports' : target;
                url = `/nySection?section=${target}`;
            } else {
                url = '/nyHome';
            }
        }
        axios.get(url)
            .then((response) => {
                let data = JSON.parse(JSON.stringify(response.data));
                if (data['status'] === 'ok') {
                    PubSub.publish('updateNewsState',{news_data:data['data'], headerSection:headerSection, isGuardian:checked});
                }
            })
            .catch((err) => {
                console.log("err: " + err.toString());
            });

        return false;
    };

    timeOut = undefined;
    lastAutoCompleteRequest = 0;

    loadOptions = (inputValue, callback) => {
        clearTimeout(this.timeOut);
        let now = Date.now();
        let delayTime = now - this.lastAutoCompleteRequest > 1000 ? 100 : (1100 - (now - this.lastAutoCompleteRequest));
        this.timeOut = setTimeout(async () => {
            try {
                this.lastAutoCompleteRequest = Date.now();
                const response = await fetch(
                    `https://api.cognitive.microsoft.com/bing/v7.0/suggestions?mkt=fr-FR&q=${inputValue}`,
                    {
                        headers: {
                            "Ocp-Apim-Subscription-Key": "8ff2d8033a66431a97467891439fc584"
                        }
                    }
                );
                const data = await response.json();
                const resultsRaw = data.suggestionGroups[0].searchSuggestions;
                const results = resultsRaw.map(result => ({ value: result.displayText, label: result.displayText }));
                callback(results);
            } catch (error) {
                console.log(`Error fetching search ${inputValue}`);
            }
        }, delayTime);
    };

    changeAutoCompletion = (inputValue) => {
        let keyword = inputValue['label'];
        this.props.history.push({
            pathname:'/search',
            search:`?q=${keyword}`,
            state:{keyword, isGuardian:this.state.checked}
        });

        if (this.state.inResultPage) {
            PubSub.publish('inResultPage',{isGuardian:this.state.checked, keyword});
        }

        this.setState({targetSection:'_Search', selectedOption:{value: keyword, label: keyword}, inResultPage:true});
    };

    clickBookmarks = () => {
        let {inBookmarkPage} = this.state;
        if (!inBookmarkPage) {
            this.props.history.push({pathname:'/favorites'});
            this.setState({inBookmarkPage:true, targetSection:'_Bookmarks'});
        }
    };

    render() {
        let {targetSection, showSwitch, selectedOption, inBookmarkPage} = this.state;

        return (
            <Navbar expand="lg" className="header_nav" variant="dark">
                <AsyncSelect
                    value={selectedOption}
                    onChange={this.changeAutoCompletion}
                    className="autocomplete"
                    loadOptions={this.loadOptions}
                    noOptionsMessage={() => "No Match"}
                    placeholder="Enter keyword .." />
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="mr-auto">
                        <NavLink onClick={() => {return this.clickSection('Home')}}
                                 className={targetSection === 'Home' ? 'nav-link target_section' : 'nav-link'}
                                 activeClassName=""
                                 to={{pathname:'/', state:{isFirst:false}}} >Home</NavLink>
                        <NavLink onClick={() => {return this.clickSection('World')}}
                                 className={targetSection === 'World' ? 'nav-link target_section' : 'nav-link'}
                                 activeClassName=""
                                 to={{pathname:'/World', state:{isFirst:false}}} >World</NavLink>
                        <NavLink onClick={() => {return this.clickSection('Politics')}}
                                 className={targetSection === 'Politics' ? 'nav-link target_section' : 'nav-link'}
                                 activeClassName=""
                                 to={{pathname:'/Politics', state:{isFirst:false}}} >Politics</NavLink>
                        <NavLink onClick={() => {return this.clickSection('Business')}}
                                 className={targetSection === 'Business' ? 'nav-link target_section' : 'nav-link'}
                                 activeClassName=""
                                 to={{pathname:'/Business', state:{isFirst:false}}} >Business</NavLink>
                        <NavLink onClick={() => {return this.clickSection('Technology')}}
                                 className={targetSection === 'Technology' ? 'nav-link target_section' : 'nav-link'}
                                 activeClassName=""
                                 to={{pathname:'/Technology', state:{isFirst:false}}} >Technology</NavLink>
                        <NavLink onClick={() => {return this.clickSection('Sport')}}
                                 className={targetSection === 'Sport' ? 'nav-link target_section' : 'nav-link'}
                                 id="nav_link_sports"
                                 activeClassName=""
                                 to={{pathname:'/Sports', state:{isFirst:false}}} >Sports</NavLink>
                    </Nav>

                    <MediaQuery minDeviceWidth={992} >
                        <div data-tip="Bookmark" data-for="header_tooltip" >
                            <FaRegBookmark style={{marginRight: showSwitch === true ? '0' : '23px', display: inBookmarkPage === true ? 'none' : 'block'}}
                                           onClick={this.clickBookmarks}
                                           className="bookmark"/>
                            <FaBookmark style={{marginRight: showSwitch === true ? '0' : '23px', display: inBookmarkPage === false ? 'none' : 'block'}}
                                        onClick={this.clickBookmarks}
                                        className="bookmark"/>
                        </div>
                        <ReactTooltip place="bottom" id="header_tooltip"/>
                    </MediaQuery>
                    <MediaQuery maxDeviceWidth={992} >
                        <FaRegBookmark style={{marginRight: showSwitch === true ? '0' : '23px', display: inBookmarkPage === true ? 'none' : 'block'}}
                                       onClick={this.clickBookmarks}
                                       className="bookmark"/>
                        <FaBookmark style={{marginRight: showSwitch === true ? '0' : '23px', display: inBookmarkPage === false ? 'none' : 'block'}}
                                    onClick={this.clickBookmarks}
                                    className="bookmark"/>
                    </MediaQuery>

                    <span style={{display: showSwitch === true ? 'block' : 'none'}} className="news_name ny_times">NYTimes</span>
                    <div className="switch_container" style={{display: showSwitch === true ? 'inline-block' : 'none'}}>
                        <Switch checked={this.state.checked}
                                uncheckedIcon={false}
                                checkedIcon={false}
                                onChange={this.changeSwitch}
                                offColor="#d9d9d9"
                                onColor="#52a6e9"
                                onHandleColor="#fff"
                                offHandleColor="#fff"/>
                    </div>
                    <span style={{display: showSwitch === true ? 'block' : 'none'}} className="news_name guardian">Guardian</span>
                </Navbar.Collapse>
            </Navbar>
        )
    }
}

export default withRouter(Header);
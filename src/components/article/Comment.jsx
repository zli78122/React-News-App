import React, {Component} from 'react'
import commentBox from 'commentbox.io';

export default class Comment extends Component {
    componentDidMount() {
        this.removeCommentBox = commentBox('5668471849353216-proj', {
            createBoxUrl(boxId, pageLocation) {
                pageLocation.search = `?box=${encodeURIComponent(boxId)}`;
                return pageLocation.href;
            }
        });
    }

    componentWillUnmount() {
        this.removeCommentBox();
    }

    render() {
        return (
            <div className="commentbox"/>
        );
    }
}
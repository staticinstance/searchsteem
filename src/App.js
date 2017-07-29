/* global window */
import React, { Component } from 'react';
import deepEqual from 'deep-equal';
import marked from 'marked';
import moment from 'moment';
import steem from 'steem';
import logo from './assets/steem.png';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      limit: 10,
      query: '',
      type: 'Created',
      posts: [],
      nsfw: false,
    };
  }

shouldComponentUpdate(nextProps, nextState){
  if(!deepEqual(nextState, this.state)){
    return true;
  } else {
    return false;
  }
}

componentWillMount(){
  this.searchSteemit();
}
componentDidUpdate(){
  this.searchSteemit();
}
  searchSteemit(){
    steem.api[`getDiscussionsBy${this.state.type}`]({
      tag: this.state.query,
      limit: this.state.limit
    }, (error, result) => this.setState({posts: result.map(post => post)}));
  }

  handleTypeChange(value){
    this.setState({
      type: value
    });
    this.searchSteemit();
  }

  handleNSFWChange(value){
    this.setState({
      nsfw: value === 'true'
    });
    this.searchSteemit();
  }

  handleLimitChange(value){
    this.setState({
      limit: value
    });
    this.searchSteemit();
  }

  handleQueryChange(value){
    value = value.replace(/ /g,'');
    this.setState({
      query: value
    });
    this.searchSteemit();
  }

  renderPosts(){
    const { posts } = this.state;
    const type = this.state.type === "Created" ? "new" : this.state.type.toLowerCase();
    return (<div style={{width: "100%", overflowX: "hidden"}}>
          {this.state.query && posts.length ? (<div style={{padding: 10, fontSize: 14}}>
            results for posts tagged with "{this.state.query}" that are {this.state.type === "Created" ? "new" : this.state.type.toLowerCase()} on steemit
          <div>view results on steemit (<a title="view on steemit" href={`https://steemit.com/created/${this.state.query.toLowerCase()}`} target="_blank">
            new
          </a> | <a title="view on steemit" href={`https://steemit.com/hot/${this.state.query.toLowerCase()}`} target="_blank">
            hot
          </a> | <a title="view on steemit" href={`https://steemit.com/trending/${this.state.query.toLowerCase()}`} target="_blank">
            trending
          </a> | <a title="view on steemit" href={`https://steemit.com/promoted/${this.state.query.toLowerCase()}`} target="_blank">
            promoted
          </a>)</div></div>) : this.state.query ? <div style={{padding: 10}}>No {type} results found for "{this.state.query}"</div> : null}
            {posts.map((post, i) => {
            const metadata = JSON.parse(post.json_metadata);
            const image = metadata.image;
            const tags = metadata.tags;
            return  (
              <table style={{margin: 10, padding: 10, height: 100, maxHeight: 100, width: "100%", borderBottom: i!==posts.length - 1 ? "1px solid lightgray" : "none"}}>
                <tbody>
                  {!this.state.nsfw && tags && tags.includes("nsfw") ? <tr><td>This post is not safe for work <select onChange={(e)=>this.handleNSFWChange(e.target.value)}>
                    <option selected={this.state.nsfw} value="false">Hide NSFW Posts</option>
                    <option selected={this.state.nsfw} value="true">Show NSFW Posts</option>
                  </select></td></tr> : (
                      <tr>
                        <td style={{position: "relative", height: 100, maxHeight: 100, maxWidth: 100, width: 100, overflow: "hidden"}}>
                        {
                          image
                            ? <a href={`https://steemit.com${post.url}`} target="_blank"><img style={{position: "absolute", top: 5, maxHeight: 80}} src={image[0]}/></a>
                            : null
                        }
                      </td>
                      <td style={{position: "relative", verticalAlign: "middle"}}>
                        <div style={{position: "absolute", top: 5}}>
                    <h3 style={{marginTop: 0,width: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                      <a style={{color: "#000000", textDecoration: "none"}} href={`https://steemit.com${post.url}`} target="_blank">{post.title}</a>
                    </h3>
                    <div>
                      ${post.pending_payout_value} | {post.active_votes.length} {post.active_votes.length === 1 ? "vote" : "votes"} | {post.replies.length} {post.replies.length === 1 ? "comment" : "comments"} | <a href={`https://steemit.com${post.url}`} target="_blank">view post on steemit</a>
                  </div>
                  <div style={{width: "auto"}}>
                    posted by <a href={`https://steemit.com/@${post.author}`} target="_blank">{`@${post.author}`}</a> (<a href={`http://steem.cool/@${post.author}`} target="_blank">steem.cool</a> | <a href={`http://steemd.com/@${post.author}`} target="_blank">steemd.com</a> | <a href={`http://steemdb.com/@${post.author}`} target="_blank">steemdb.com</a>) in <a href={`http://steemit.com/${this.state.type.toLowerCase()}/${tags && tags[0] ? tags[0] : '?' }`} target="_blank"> {tags && tags[0] ? tags[0] : '?'}</a> on {moment(post.active).format('MMMM Do YYYY, h:mm:ss a')}
                  </div>
                </div>
                </td>
              </tr>)}
      </tbody></table>)})
    }</div>);
  }

  render() {
    return (
      <div style={{width: window.screen.width, paddingBottom: 0, overflow: "hidden"}}>
        <div style={{position: "relative", height: "100%", padding: 10, borderBottom: "1px solid #1a5099", width: window.screen.width, backgroundColor: "#4ba2f2"}}>
          <span>
            <img style={{height: 35, verticalAlign: "middle", paddingRight: 10}} src={logo} />
          </span>
          <span>
              <input style={{width: 300}} onChange={(e)=>this.handleQueryChange(e.target.value)} type="text" value={this.state.query} placeholder="Search a Tag (one word only)" />
            <span style={{position: "relative", left: 10}}><select onChange={(e)=>this.handleTypeChange(e.target.value)}>
                <option value="Created">Search New Posts</option>
              <option value="Hot">Search Hot Posts</option>
            <option value="Trending">Search Trending Posts</option>
          <option value="Promoted">Search Promoted Posts</option>
              </select>
              <select onChange={(e)=>this.handleLimitChange(e.target.value)}>
                <option value="10">Show 10 Posts</option>
              <option value="50">Show 50 Posts</option>
            <option value="100">Show 100 Posts</option>
              </select>
              <select onChange={(e)=>this.handleNSFWChange(e.target.value)}>
                <option selected={this.state.nsfw} value="false">Hide NSFW Posts</option>
                <option selected={this.state.nsfw} value="true">Show NSFW Posts</option>
              </select>
            </span>
            <span style={{color: "#FFFFFF", fontSize: 12, float: "right", paddingTop: 10, paddingRight: 20}}>
              created by <a style={{color: "#FFFFFF", textDecoration: "none"}} href="https://steemit.com/@staticinstance" target="_blank">@staticinstance</a>
            </span>
          </span>
        </div>
        <div style={{position: "absolute", top: 60, bottom: 0,left: 0, right: 0,overflow: "auto"}}>
          {this.renderPosts()}
        </div>
      </div>
    );
  }
}

export default App;

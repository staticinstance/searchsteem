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
    console.log('type', value)
  }

  handleNSFWChange(value){
    this.setState({
      nsfw: value === 'true'
    });
    this.searchSteemit();
    console.log('type', value)
  }

  handleLimitChange(value){
    this.setState({
      limit: value
    });
    this.searchSteemit();
    console.log('limit', value)
  }

  handleQueryChange(value){
    value = value.replace(/ /g,'');
    this.setState({
      query: value
    });
    this.searchSteemit();
    console.log('query', value)
  }

  renderPosts(){
    const { posts } = this.state;
    const type = this.state.type === "Created" ? "new" : this.state.type.toLowerCase();
    return (<div>
          {this.state.query && posts.length ? (<div style={{padding: 10}}><a href={`https://steemit.com/${this.state.type.toLowerCase()}/${this.state.query.toLowerCase()}`} target="_blank">
            View {type} results for "{this.state.query}" on steemit
          </a></div>) : this.state.query ? <div style={{padding: 10}}>No {type} results found for "{this.state.query}"</div> : null}
            {posts.map(post => {
            const metadata = JSON.parse(post.json_metadata);
            const image = metadata.image;
            const tags = metadata.tags;
            return  (
              <table style={{margin: 10, padding: 10, height: 100, maxHeight: 100, width: "100%", borderBottom: "1px solid lightgray"}}>
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
                    <h3 style={{marginTop: 0}}>
                    <a style={{color: "#000000", textDecoration: "none"}} href={`https://steemit.com${post.url}`} target="_blank">{post.title}</a>
                  </h3>
                    <div>
                      ${post.pending_payout_value} | {post.active_votes.length} {post.active_votes.length === 1 ? "vote" : "votes"} | {post.replies.length} {post.replies.length === 1 ? "comment" : "comments"} | <a href={`https://steemit.com${post.url}`} target="_blank">view post on steemit</a>
                  </div>
                  <div>
                    posted by <a href={`https://steemit.com/@${post.author}`} target="_blank">{`@${post.author}`}</a> in <a href={`https://steemit.com/${this.state.type.toLowerCase()}/${tags && tags[0] ? tags[0] : '?' }`} target="_blank"> {tags && tags[0] ? tags[0] : '?'}</a> on {moment(post.active).format('LLLL')}
                  </div>
                </div>
                </td>
              </tr>)}
      </tbody></table>)})
    }</div>);
  }

  render() {
    console.log(this.state.posts)
    return (
      <div style={{width: window.screen.width}}>
        <div style={{padding: 10, borderBottom: "1px solid lightgray", width: window.screen.width}}>
          <span>
            <img style={{height: 40, verticalAlign: "middle", paddingRight: 10}} src={logo} />
          </span>
          <span>
              <input style={{width: 300}} onChange={(e)=>this.handleQueryChange(e.target.value)} type="text" value={this.state.query} placeholder="Search a Tag (one word only)" />
            <select onChange={(e)=>this.handleTypeChange(e.target.value)}>
              <option value="Created">New</option>
              <option value="Hot">Hot</option>
              <option value="Trending">Trending</option>
              <option value="Promoted">Promoted</option>
            </select>
              <select onChange={(e)=>this.handleLimitChange(e.target.value)}>
                <option value="10">10 Posts</option>
                <option value="50">50 Posts</option>
                <option value="100">100 Posts</option>
              </select>
              <select onChange={(e)=>this.handleNSFWChange(e.target.value)}>
                <option selected={this.state.nsfw} value="false">Hide NSFW Posts</option>
                <option selected={this.state.nsfw} value="true">Show NSFW Posts</option>
              </select>
          </span>
          <span style={{float: "right", paddingTop: 10, paddingRight: 20}}>
            <a style={{textDecoration: "none"}} href="https://steemit.com/@staticinstance" target="_blank">@staticinstance</a>
          </span>
        </div>
        {this.renderPosts()}
      </div>
    );
  }
}

export default App;

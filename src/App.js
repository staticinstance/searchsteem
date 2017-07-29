/* global window */
import React, { Component } from 'react';
import deepEqual from 'deep-equal';
import marked from 'marked';
import moment from 'moment';
import steem from 'steem';

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
    return (<div>
          {this.state.query && posts.length ? (<div style={{padding: 10}}><a href={`https://steemit.com/${this.state.type.toLowerCase()}/${this.state.query.toLowerCase()}`} target="_blank">
            View {this.state.type === "Created" ? "new" : "trending"} results for "{this.state.query}" on steemit
          </a></div>) : this.state.query ? <div style={{padding: 10}}>No results found for {this.state.query}</div> : null}
            {posts.map(post => {
            const metadata = JSON.parse(post.json_metadata);
            const image = metadata.image;
            const tags = metadata.tags;
            return  (
              <table style={{margin: 10, padding: 10, height: 100, maxHeight: 100, width: "100%", borderBottom: "1px solid lightgray"}}>
                <tbody>
                  {!this.state.nsfw && tags.includes("nsfw") ? <tr><td>This post is not safe for work</td></tr> : (
                      <tr>
                        <td style={{maxHeight: 100, maxWidth: 100, width: 100, overflow: "hidden"}}>
                        {
                          image
                            ? <img style={{maxHeight: 100}} src={image[0]}/>
                            : null
                        }
                      </td>
                      <td>
                    <div>
                    {post.title}
                  </div>
                    <div>
                      pending payout ${post.pending_payout_value} | {post.active_votes.length} {post.active_votes.length === 1 ? "vote" : "votes"} | {post.replies.length} {post.replies.length === 1 ? "comment" : "comments"} | <a href={post.url} target="_blank">view on steemit</a>
                  </div>
                  <div>
                    posted by <a href={`https://steemit.com/@${post.author}`} target="_blank">{`@${post.author}`}</a> on {moment(post.active).format('LLLL')}
                  </div>
                </td>
              </tr>)}
      </tbody></table>)})
    }</div>);
  }

  render() {
    console.log(this.state.posts)
    return (
      <div>
        <div style={{borderBottom: "1px solid lightgray", width: window.screen.width}}>
          <div style={{padding: 10}}>
            Search Steem
          </div>
          <div style={{padding: 10}}>
              <input onChange={(e)=>this.handleQueryChange(e.target.value)} type="text" value={this.state.query} placeholder="Tag (one word only)" />
            <select onChange={(e)=>this.handleTypeChange(e.target.value)}>
                <option value="Created">New</option>
                <option value="Trending">Trending</option>
              </select>
              <select onChange={(e)=>this.handleLimitChange(e.target.value)}>
                <option value="10">10 Posts</option>
              <option value="50">50 Posts</option>
            <option value="100">100 Posts</option>
              </select>
              <select onChange={(e)=>this.handleNSFWChange(e.target.value)}>
                <option value="false">Hide NSFW Posts</option>
              <option value="true">show NSFW Posts</option>
              </select>
          </div>
        </div>
        {this.renderPosts()}
      </div>
    );
  }
}

export default App;

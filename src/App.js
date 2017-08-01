/* global window */
import React, { Component } from 'react';
import deepEqual from 'deep-equal';
import moment from 'moment';
import steem from 'steem';
import logo from './assets/steem.png';
import defaultPhoto from './assets/no-photo.png';
import styles from './styles';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      query: '',
      type: 'Trending',
      posts: [],
      nsfw: false,
      loading: false,
      shownNSFWPosts: {},
      lastQuery: '',
    };
  }

  getTagsFromPost(post){
    const metadata = JSON.parse(post.json_metadata);
    return metadata.tags;
  }

  sortPostsByTags(a,b){
    const totals = {
      a: 0,
      b: 0,
    }

    this.state.query.split(" ").forEach(tag => {
      if(this.getTagsFromPost(a) && this.getTagsFromPost(a).includes(tag)){
        totals.a++;
      }
      if(this.getTagsFromPost(b) && this.getTagsFromPost(b).includes(tag)){
        totals.b++;
      }
    });

    return totals.b - totals.a;
  }

  compareVotes(a,b) {
    if (a.rshares > b.rshares){
      return -1;
    }
    if (a.rshares < b.rshares){
      return 1;
    }
    return 0;
  }

  sortPostsByDate(a,b) {
    if (a.created > b.created){
      return -1;
    }
    if (a.created < b.created){
      return 1;
    }
    return 0;
  }

  shouldComponentUpdate(nextProps, nextState){
    if(!deepEqual(nextState.query, this.state.query) ||
       !deepEqual(nextState.shownNSFWPosts, this.state.shownNSFWPosts) ||
       !deepEqual(nextState.type, this.state.type) ||
       !deepEqual(nextState.nsfw, this.state.nsfw) ||
       !deepEqual(nextState.posts, this.state.posts) ||
       !deepEqual(nextState.loading, this.state.loading)){
      return true;
    } else {
      return false;
    }
  }

  doSearch(){
    this.setState({
      query: this.searchInput.value.toLowerCase(),
      loading: true,
      posts: []
    })
    this.searchSteemit();
  }

  componentDidUpdate(nextProps, nextState){
    if(!deepEqual(nextState.type, this.state.type)){
         this.doSearch();
    }
  }

  componentDidMount(){
    this.searchInput.focus();
    this.doSearch();
  }

  searchSteemit(){
    let posts = [];
    this.total = this.state.query.trim().split(" ").length;
    this.state.query.trim().split(" ").forEach((query, i) => {
      if(query !== " "){
        try{
          steem.api[`getDiscussionsBy${this.state.type}`]({
            tag: query,
            limit: 100
          }, (error, result) => {
              //dedupe
              if(error || !result || !result.reduce){
                console.log(error)
                this.setState({loading: false, posts: []});
                return;
              }
              result = result.reduce((deduped, item) => {
                const notFound = posts.filter(r => {
                  return r.id === item.id
                }).length === 0
                if(notFound){
                  deduped.push(item)
                }
                return deduped;
              }, []);

              posts = posts.concat(result).sort((a,b) => this.sortPostsByTags(a,b));
              if(i === this.total - 1){
                this.setState({lastQuery: this.state.query, loading: false, posts: posts});
              }
          });
        }catch(e){
          this.setState({loading: false, posts: []});
        }
      }
    })
  }

  handleTypeChange(value){
    this.setState({
      type: value
    });
  }

  toggleNSFW(){
    this.setState({
      nsfw: !this.state.nsfw,
      shownNSFWPosts: this.state.nsfw ? {} : this.state.shownNSFWPosts
    });
  }

  renderVotersTitle(post){
    let title = post.active_votes.sort(this.compareVotes).slice(0, 11).reduce((voters, vote, i) => {
      voters = `${voters}${vote.voter}${(post.active_votes.length - 2 >= i) ? '\n' : ''}`;
      return voters;
    }, post.active_votes.length > 10 ? "\n🏆 Top Voters\n\n" : "");
    if(post.active_votes.length > 10){
      title = `${title}\n${post.active_votes.length - 10} more not shown`
    }
    return title;
  }

  renderNSFWToggle(style){
    return null;
    // return <span
    //   style={{...styles.button, ...this.state.nsfw ? styles.nsfwButton : {}}}
    //   title={`Posts tagged with "Not Safe For Work" are currently being ${this.state.nsfw ? 'shown' : 'hidden'}.  Click to ${this.state.nsfw ? 'hide' : 'show'} them.`}
    //   onClick={()=>this.toggleNSFW()}>
    //   {`${this.state.nsfw ? 'HIDE' : 'SHOW'} ALL NSFW POSTS`}
    // </span>
  }

  renderNSFWSingleToggle(id){
    return <span
      style={{...styles.button, ...this.state.shownNSFWPosts[id] ? styles.nsfwButton : {}}}
      onClick={()=>{
        this.setState({
          shownNSFWPosts: (()=>{
            const shownNSFWPosts = this.state.shownNSFWPosts;
            shownNSFWPosts[id] = !this.state.shownNSFWPosts[id];
            return shownNSFWPosts;
          })()
        })
        this.forceUpdate();
      }
    }>
      {`${this.state.shownNSFWPosts[id] ? 'HIDE THIS' : 'SHOW THIS'} NSFW POST`}
    </span>
  }

  renderPosts(){
    const { posts = [], shownNSFWPosts } = this.state;
    return (
      <div style={styles.postsContainer}>
      {posts.map((post, i) => {
      const metadata = JSON.parse(post.json_metadata);
      const image = metadata.image;
      post.tags = metadata.tags;
      return  (
        <table key={i} style={{...{borderBottom: i!==posts.length - 1 ? "1px solid lightgray" : "none"},...styles.postTable}}>
          <tbody>
            {!this.state.nsfw && post.tags && post.tags.includes("nsfw") && !shownNSFWPosts[post.id]
              ? <tr>
                  <td style={styles.nsfwDefaultImage}>
                    <a href={`https://steemit.com${post.url}`} target="_blank">
                    <img
                      alt={post.title}
                      title={post.title}
                      style={styles.postImage}
                      src={defaultPhoto}/>
                    </a>
                  </td>
                  <td style={styles.postInfo}>
                    <span style={styles.nsfwToggleContainer}>
                      {this.renderNSFWSingleToggle(post.id)}
                      {this.renderNSFWToggle()}
                    </span>
                  <a style={styles.nsfwMessage}>
                    This post has been tagged with "Not Safe For Work"
                  </a>
                  <div style={styles.metadataContainer}>
                    {this.renderPostMetaData(post)}
                  </div>
                  </td>
                </tr>
              : (
                <tr>
                  <td style={styles.postImageContainer}>
                  {
                    image
                      ? <a href={`https://steemit.com${post.url}`} target="_blank">
                          <img alt={post.title} title={post.title} style={styles.postImage} src={image[0]}/>
                        </a>
                      : <a href={`https://steemit.com${post.url}`} target="_blank">
                          <img alt={post.title} title={post.title} style={styles.postImage} src={defaultPhoto}/>
                        </a>
                  }
                </td>
                <td style={styles.nsfwPostContainer}>
                  {post.tags && post.tags.includes("nsfw")
                    ? <span style={styles.nsfwToggleContainer}>
                      {this.renderNSFWSingleToggle(post.id)}
                      {this.renderNSFWToggle()}
                    </span>
                    : null}
                  <a style={styles.postTitle}
                    href={`https://steemit.com${post.url}`}
                    target="_blank">
                    {post.title}
                  </a>
                  <div style={styles.metadataContainer}>
                    {this.renderPostMetaData(post)}
                  </div>
                </td>
              </tr>)}
            </tbody></table>)})
          }</div>);
  }

  renderPostMetaData(post){
    return <div>
          <span
            title={`$${post.pending_payout_value.replace(' SBD', '')} potential payout`}>
            ${post.pending_payout_value.replace('SBD', '')}
          </span> | <span style={{cursor: "pointer"}}
              title={this.renderVotersTitle(post)}>
              {post.active_votes.length} {post.active_votes.length === 1 ? "vote" : "votes"}
            </span> | {post.children} {post.children === 1 ? "comment" : "comments"} | {moment(post.created).format('MMMM Do YYYY, h:mm a')} | <a
              href={`https://steemit.com${post.url}`}
              target="_blank">
              view post on steemit
            </a>
          <div>
            <a
              href={`https://steemit.com/@${post.author}`}
              target="_blank">
              {`@${post.author}`}
            </a> (<a
              href={`http://steem.cool/@${post.author}`}
              target="_blank">steem.cool</a> | <a
              href={`http://steemd.com/@${post.author}`}
              target="_blank">steemd.com</a> | <a
              href={`http://steemdb.com/@${post.author}`}
              target="_blank">steemdb.com</a>)
            {
              post.tags && post.tags[0]
                ? <div style={styles.tagButtons}>{ post.tags.map(tag => <span
                  key={tag}
                  style={{...styles.button, ...this.state.query.split(" ").includes(tag)
                    ? styles.selectedButton
                    : {}}}
                  onClick={() => {
                    this.setState({query: tag.toLowerCase()});
                    this.searchInput.value = tag.toLowerCase();
                    this.doSearch();
                  }
                  } target="_blank">
                        {tag}
                      </span>)
                    }
                  </div>
                : null
            }
          </div>
    </div>
  }

  getLoadingMessage(){
    this.loadingMessage = <div>
        {
          this.state.query
            ? <span>Searching for <span style={styles.bold}>{this.state.type === "Created" ? "new" : this.state.type.toLowerCase()}</span> posts tagged with <span style={{fontWeight: "bold"}}>{this.state.query}</span></span>
            : <span>Loading {this.state.type === "Created" ? "New" : this.state.type} posts</span>
        }
    </div>
    return this.loadingMessage;
  }

  getNotFoundMessage(){
    // this needs to be refactored to move found message into get Found message
    this.foundMessage = <div>{this.state.type === "Created" ? "New" : this.state.type} posts</div>;
    return this.state.query
      ? <div>
          Couldn't find any <span style={styles.bold}>
            {this.state.type === "Created" ? " new " : this.state.type.toLowerCase()}
          </span> posts tagged with <span style={styles.bold}> {this.state.query}</span>
        </div>
      : this.foundMessage
  }

  getFoundMessage(){
    this.foundMessage = <div>
        Viewing results for <span style={styles.bold}>{this.state.type === "Created" ? "new" : this.state.type.toLowerCase()}</span> posts tagged with <span style={{fontWeight: "bold"}}>{this.state.query}</span>
      </div>

    return this.foundMessage;
  }

  renderPostList(){
    return <div>
        <div style={styles.searchStatusMessageContainer}>
          {
            (this.state.loading === true && Array.isArray(this.state.posts) && !this.state.posts.length)
              ? <div>
                {this.getLoadingMessage()}
                <div style={styles.loadingPanel}>
                </div>
              </div>
              : this.state.query && Array.isArray(this.state.posts) && this.state.posts.length
                ? this.state.query === this.state.lastQuery
                  ? this.getFoundMessage()
                  : this.foundMessage
                : this.getNotFoundMessage()
          }
        </div>
        <div style={styles.postContainer}>
          {this.renderPosts()}
        </div>
      </div>
  }

  renderHeader(){
    return <div style={styles.header}>
        <span>
          <img
            alt='SearchSteem!'
            title='SearchSteem!'
            style={styles.logo}
            src={logo} />
        </span>
        <span>
            <input
              onKeyDown={(e) => this.handleSearchInputKeyDown(e)}
              ref={(input) => { this.searchInput = input; }}
              style={styles.searchInput}
              type="text"
              placeholder="Search..." />
            {this.renderPostTypeButtons()}
            {this.renderNSFWToggle()}
        <span style={styles.author}>
          created by <a
            style={styles.authorLink}
            href="https://steemit.com/@staticinstance"
            target="_blank"
            rel="noopener noreferrer">
            @staticinstance</a>
        </span>
      </span>
    </div>
  }

  handleSearchInputKeyDown(e){
    if (e.key === 'Enter') {
      this.doSearch();
    }
  }

  isTypeSelected(type){
    return this.state.type === type;
  }

  renderPostTypeButtons(){
    return <span style={styles.typeButtons}>
      <div style={{...styles.button, ...styles.selectedButton, ...styles.searchButton}}
        onClick={()=>this.doSearch()}>Search</div>
      <div style={{...styles.button, ...this.isTypeSelected('Created')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Created")}>New</div>
      <div style={{...styles.button, ...this.isTypeSelected('Hot')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Hot")}>Hot</div>
      <div style={{...styles.button, ...this.isTypeSelected('Trending')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Trending")}>Trending</div>
      <div style={{...styles.button, ...this.isTypeSelected('Promoted')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Promoted")}>Promoted</div>
    </span>
  }

  render() {
    return (<div style={styles.mainContainer}>
            {this.renderHeader()}
            {this.renderPostList()}
        </div>
    );
  }
}

export default App;

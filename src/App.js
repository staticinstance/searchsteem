/* global window */
import React, { Component } from 'react';
import moment from 'moment';
import steem from 'steem';
import logo from './assets/steem.png';
import defaultPhoto from './assets/no-photo.png';
import refresh from './assets/refresh.png';
import resteemed from './assets/resteemed.png';
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

  canSearch = true;

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

  getQueryDisplay(){
    const query = this.searchInput ? this.searchInput.value : '';

    return this.state.type === "Blog" && query.charAt(0) !== '@' ? <span style={styles.bold}>@{query.toLowerCase().replace(' ', '').trim()}</span> : query.trim();
  }

  doSearch(){
    const query = this.state.type === "Blog"
      ? this.searchInput.value.replace(" ", "").replace(/([^a-zA-Z])+/i, "")
      : this.searchInput.value
    this.setState({
      query: query,
      loading: true,
      posts: []
    });
  }

  componentDidMount(){
    this.searchInput.focus();
    this.doSearch();
  }

  componentDidUpdate(){
    if(this.canSearch){
      this.searchSteemit();
      this.canSearch = false;
    }
  }

  searchSteemit(){
    const { type } = this.state;
    const originalQuery = this.searchInput.value;
    const query = type === 'Blog'
      ? this.searchInput.value.toLowerCase().replace(' ', '').trim()
      : this.searchInput.value.toLowerCase().trim()

    const queryArray = query.split(" ")

    //add all as one tag in case it's a username
    if(type !== 'Blog'){
      queryArray.push(this.searchInput.value.replace(' ', '').trim())
    }

    this.searchInput.value = "Searching...";
    let posts = [];
    const total = queryArray.length;
    total
      ? queryArray.forEach((q, i) => {
          if(q !== " "){
            try{
              steem.api[`getDiscussionsBy${type}`]({
                tag: q,
                limit: 20
              }, (error, result) => {
                  //dedupe
                  if(error || !result || !result.reduce){
                    this.searchInput.value = originalQuery;
                    this.searchInput.focus();
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

                  posts = posts.concat(result);
                  posts = type === "Blog"
                    ? posts = posts.sort((a,b) => this.sortPostsByDate(a,b))
                    : posts = posts.sort((a,b) => this.sortPostsByTags(a,b))

                  if(i === total - 1){
                    this.searchInput.value = originalQuery;
                    this.setState({lastQuery: q, loading: false, posts: posts});
                    this.forceUpdate();
                    this.canSearch = true;
                    this.searchInput.focus();
                  }
              })
            }catch(e){
              this.searchInput.value = originalQuery;
              this.searchInput.focus();
              this.setState({loading: false, posts: []});
            }
          }
        })
      : (() => {
            this.searchInput.value = originalQuery;
            this.searchInput.focus();
          }
        )()
  }

  handleTypeChange(value){
    this.setState({
      query: this.searchInput.value,
      type: value
    });
    this.doSearch();
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
                    {this.getResteemed(post.author)}
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
                  {this.getResteemed(post.author)}
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

  getResteemed(author){
    const { type } = this.state;
    const query = this.searchInput ? this.searchInput.value.trim().replace(' ', '') : '';
    return type === 'Blog' && author !== query ? <div><img style={styles.resteemedImage} src={resteemed} alt="Resteemd" />Resteemed</div> : null
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
                  style={{...styles.button, ...this.searchInput.value.toLowerCase().split(" ").includes(tag)
                    || [this.searchInput.value.toLowerCase().replace(' ', '').trim()].includes(tag)
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

  getUserLoadingMessage(){
    return <span>Searching for the latest posts by {this.getQueryDisplay()}</span>
  }

  getNonUserLoadingMessage(){
    return <span>Searching for <span style={styles.bold}>{this.state.type === "Created" ? "new" : this.state.type.toLowerCase()}</span> posts tagged with <span style={{fontWeight: "bold"}}>{this.getQueryDisplay()}</span></span>
  }

  getLoadingMessage(){
    this.loadingMessage = <div>
        {
          this.state.query || this.state.type === 'Blog'
            ? this.state.type === 'Blog'
              ? this.getUserLoadingMessage()
              : this.getNonUserLoadingMessage()
            : <span>Searching for {this.getTypeDisplay()} posts</span>
        }
    </div>
    return this.loadingMessage;
  }

  getNotFoundMessageDisplay(){
    return this.state.query
      ? this.getNotFoundMessage()
      : this.foundMessage
  }

  getTypeDisplay(){
    return this.state.type === "Created" ? "New" : this.state.type
  }

  getRefreshImage(){
    return <img title="Refresh" alt="Refresh" src={refresh} style={styles.refreshButton} onClick={() => this.doSearch()} />
  }

  getNotFoundMessage(){
    return this.state.type === 'Blog'
      ? <div>Couldn't find any posts by {this.getQueryDisplay()} {this.getRefreshImage()}</div>
      : <div>
          Couldn't find any <span style={styles.bold}>
            {this.state.type === "Created" ? " new " : this.state.type.toLowerCase()}
          </span> posts tagged with <span style={styles.bold}> {this.getQueryDisplay()}</span> {this.getRefreshImage()}
        </div>
  }

  getFoundMessage(){
    if(this.searchInput && this.searchInput.value.replace(' ', '') === ''){
      return <div>{this.getTypeDisplay()} posts {this.getRefreshImage()}</div>;
    }

    return this.state.type === 'Blog'
      ? <div>Viewing the latest posts by {this.getQueryDisplay()} {this.getRefreshImage()}</div>
      : <div>
          Viewing results for <span style={styles.bold}>{this.state.type === "Created" ? "new" : this.state.type.toLowerCase()}</span> posts tagged with <span style={{fontWeight: "bold"}}>{this.getQueryDisplay()}</span> {this.getRefreshImage()}
        </div>
  }

  getLoadingImage(){
    return <div style={{...{height: window.screen.height / 2 - 72}, ...styles.loadingPanel}}>
             <img
               src={logo}
               style={styles.loadingImage}
               className="spinner"
               alt={this.getLoadingMessage()}/>
           </div>
  }

  renderPostList(){
    return <div>
        <div style={styles.searchStatusMessageContainer}>
          {
            (this.state.loading === true && Array.isArray(this.state.posts) && !this.state.posts.length)
              ? <div>
                {this.getLoadingMessage()}
                {this.getLoadingImage()}
              </div>
              : Array.isArray(this.state.posts) && this.state.posts.length
                ? this.getFoundMessage()
                : this.getNotFoundMessageDisplay()
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
            alt='WeSteem'
            title='WeSteem '
            style={styles.logo}
            src={logo} />
        </span>
        <span>
            <input
              disabled={this.state.loading}
              onKeyDown={(e) => this.handleSearchInputKeyDown(e)}
              ref={(input) => { this.searchInput = input; }}
              style={styles.searchInput}
              type="text"
              placeholder={'Search'} />
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

  getTypeButtonTitle(buttonName){
    const { query } = this.state;

    if(buttonName === 'User'){
      return `Show the latest posts by ${this.getQueryDisplay()}`
    } else if(!query){
      return `Show ${buttonName.toLowerCase()} posts`
    } else {
      return `Show ${buttonName.toLowerCase()} posts tagged with ${this.getQueryDisplay()}`
    }
  }

  renderPostTypeButtons(){
    return <span style={styles.typeButtons}>
      <div title="Search" style={{...styles.button, ...styles.selectedButton, ...styles.searchButton}}
        onClick={()=>this.doSearch()}>Search</div>
      <div title={this.getTypeButtonTitle("User")} style={{...styles.button, ...this.isTypeSelected('Blog')
        ? styles.selectedButton
        : {}}}
        onClick={()=> !this.searchInput.value
          ? alert("Please enter a username")
          : this.handleTypeChange("Blog")}>User</div>
      <div title={this.getTypeButtonTitle("New")} style={{...styles.button, ...this.isTypeSelected('Created')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Created")}>New</div>
      <div title={this.getTypeButtonTitle("Hot")} style={{...styles.button, ...this.isTypeSelected('Hot')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Hot")}>Hot</div>
      <div  title={this.getTypeButtonTitle("Trending")} style={{...styles.button, ...this.isTypeSelected('Trending')
        ? styles.selectedButton
        : {}}}
        onClick={()=>this.handleTypeChange("Trending")}>Trending</div>
      <div title={this.getTypeButtonTitle("Promoted")} style={{...styles.button, ...this.isTypeSelected('Promoted')
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

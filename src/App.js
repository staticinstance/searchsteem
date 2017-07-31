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
      shownNSFWPosts: {}
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
      if(this.getTagsFromPost(a).includes(tag)){
        totals.a++;
      }
      if(this.getTagsFromPost(a).includes(tag)){
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

  componentDidUpdate(nextProps, nextState){
    if((!deepEqual(nextState.query, this.state.query) && nextState.query.replace(" ", "") !== this.state.query.replace(" ", ""))
        || !deepEqual(nextState.type, this.state.type)){
         if(this.searchTimeout){
           clearTimeout(this.searchTimeout);
         }
         this.setState({
           loading: true,
           posts: []
         })
         this.searchTimeout=setTimeout(() => this.searchSteemit(), 500);
    }
  }

  componentDidMount(){
    this.searchInput.focus();
    this.getTrendingPosts();
  }

  componentWillMount(){
    this.searchSteemit();
  }

  getTrendingPosts(){
    if(!this.state.loading){
      this.setState({loading: true});
    }
    steem.api['getDiscussionsByTrending']({
      tag: "",
      limit: 100
    }, (error, result) => {
          this.setState({loading: false, posts: result});
          this.forceUpdate()
      })
  }

  searchSteemit(){
    let posts = [];
    this.total = this.state.query.trim().split(" ").length;
    this.state.query.trim().split(" ").forEach((query, i) => {
      if(query !== " "){
        steem.api[`getDiscussionsBy${this.state.type}`]({
          tag: query,
          limit: 100
        }, (error, result) => {
            //dedupe
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
              this.setState({loading: false, posts: posts});
            }
        })
      }
    })
  }

  handleTypeChange(value){
    if(!this.state.loading){
      this.setState({loading: true});
    }
    this.setState({
      type: value
    });
  }

  toggleNSFW(){
    if(!this.state.loading){
      this.setState({loading: true});
    }
    this.setState({
      nsfw: !this.state.nsfw,
      shownNSFWPosts: this.state.nsfw ? {} : this.state.shownNSFWPosts
    });
    this.forceUpdate();
  }

  handleQueryChange(value){
    if(!this.state.loading){
      this.setState({loading: true});
    }
    this.setState({
      query: value
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
    const { posts, shownNSFWPosts } = this.state;
    return (
      <div style={{width: "100%", overflowX: "hidden"}}>
      {posts.map((post, i) => {
      const metadata = JSON.parse(post.json_metadata);
      const image = metadata.image;
      post.tags = metadata.tags;
      return  (
        <table key={i} style={{
            padding: 10,
            paddingTop: 5,
            paddingBottom: 0,
            height: 100,
            width: "100%",
            borderBottom: i!==posts.length - 1 ? "1px solid lightgray" : "none"}}>
          <tbody>
            {!this.state.nsfw && post.tags && post.tags.includes("nsfw") && !shownNSFWPosts[post.id]
              ? <tr>
                  <td style={{position: "relative", height: 100, maxWidth: 100, width: 100, overflow: "hidden"}}>
                    <a href={`https://steemit.com${post.url}`} target="_blank"><img alt={post.title} title={post.title} style={styles.postImage} src={defaultPhoto}/></a>
                  </td>
                  <td style={{verticalAlign: 'top'}}>
                    <span style={{paddingRight: 10}}>{this.renderNSFWSingleToggle(post.id)}{this.renderNSFWToggle()}</span>
                    <a style={{fontWeight: "bold", color: "#000000", textDecoration: "none"}}>This post has been tagged with "Not Safe For Work"</a>
                    <div style={{paddingTop: 10}}>{this.renderPostMetaData(post)}</div>
                  </td>
                </tr>
              : (
                <tr>
                  <td style={{position: "relative", height: 100, maxWidth: 100, width: 100, overflow: "hidden"}}>
                  {
                    image
                      ? <a href={`https://steemit.com${post.url}`} target="_blank"><img alt={post.title} title={post.title} style={styles.postImage} src={image[0]}/></a>
                      : <a href={`https://steemit.com${post.url}`} target="_blank"><img alt={post.title} title={post.title} style={styles.postImage} src={defaultPhoto}/></a>
                  }
                </td>
                <td style={{verticalAlign: 'top'}}>
                  {post.tags && post.tags.includes("nsfw")
                    ? <span style={{paddingRight: 10}}>{this.renderNSFWSingleToggle(post.id)}{this.renderNSFWToggle()}</span>
                    : null}
                  <a style={{fontWeight: "bold", color: "#000000", textDecoration: "none"}} href={`https://steemit.com${post.url}`} target="_blank">{post.title}</a>
                  <div style={{paddingTop: 10}}>
                    {this.renderPostMetaData(post)}
                  </div>
                </td>
              </tr>)}
            </tbody></table>)})
          }</div>);
  }

  renderPostMetaData(post){
    return <div style={{width: '100%'}}>
          <span title={`$${post.pending_payout_value.replace(' SBD', '')} potential payout`}>${post.pending_payout_value.replace('SBD', '')}</span> | <span style={{cursor: "pointer"}} title={this.renderVotersTitle(post)}>{post.active_votes.length} {post.active_votes.length === 1 ? "vote" : "votes"}</span> | {post.children} {post.children === 1 ? "comment" : "comments"} | {moment(post.created).format('MMMM Do YYYY, h:mm a')} | <a href={`https://steemit.com${post.url}`} target="_blank">view post on steemit</a>
          <div style={{width: "100%"}}>
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
                  onClick={() => this.setState({query: tag})} target="_blank">
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
    return this.state.query
      ? <div style={{padding: 10, fontSize: 14}}>Searching for <span style={{fontWeight: "bold"}}>{this.state.type === "Created" ? "new" : this.state.type.toLowerCase()}</span> posts tagged with <span style={{fontWeight: "bold"}}>{this.state.query}</span>...</div>
      : <div style={{padding: 10, fontSize: 14}}>Loading {this.state.type === "Created" ? "New" : this.state.type} posts...</div>
  }

  getNotFoundMessage(){
    return this.state.query
      ? <div>
          Couldn't find any <span style={{fontWeight: "bold"}}>
            {this.state.type === "Created" ? " new " : this.state.type.toLowerCase()}
          </span> posts tagged with <span style={{fontWeight: "bold"}}> {this.state.query}</span>
        </div>
      : <div>{this.state.type === "Created" ? "New" : this.state.type} posts</div>
  }

  getPostList(){
    return <div style={{width: "100%"}}>
        <div style={{width: "100%",borderBottom: "1px solid lightgray", padding: 10, fontSize: 14}}>
          {
            this.state.query && this.state.posts.length
            ? <div>
                Viewing results for <span style={{fontWeight: "bold"}}>{this.state.type === "Created" ? "new" : this.state.type.toLowerCase()}</span> posts tagged with <span style={{fontWeight: "bold"}}>{this.state.query}</span>
              </div>
            : this.getNotFoundMessage()
          }
        </div>
        <div style={{width: "100%", position: "absolute", top: 93, bottom: 0,left: 0, right: 0,overflow: "auto"}}>
          {this.renderPosts()}
        </div>
      </div>
  }

  renderHeader(){
    return <div style={{position: "relative", height: "100%", padding: 10, borderBottom: "1px solid #1a5099", width: "100%", backgroundColor: "#4ba2f2"}}>
        <span>
          <img alt='SearchSteem!' title='SearchSteem!' style={{height: 35, verticalAlign: "middle", paddingRight: 10}} src={logo} />
        </span>
        <span>
            <input ref={(input) => { this.searchInput = input; }} style={{width: 300}} onChange={(e)=>this.handleQueryChange(e.target.value)} type="text" value={this.state.query} placeholder="Search..." />
        <span style={{position: "relative", left: 10}}>
          {this.renderPostTypeButtons()}
          {this.renderNSFWToggle()}
        </span>
        <span style={{color: "#FFFFFF", fontSize: 12, float: "right", paddingTop: 10, paddingRight: 20}}>
          created by <a
            style={{color: "#FFFFFF", textDecoration: "none"}}
            href="https://steemit.com/@staticinstance"
            target="_blank"
            rel="noopener noreferrer">
            @staticinstance</a>
        </span>
      </span>
    </div>
  }

  isTypeSelected(type){
    return this.state.type === type;
  }

  renderPostTypeButtons(){
    return <span style={styles.typeButtons}>
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

  renderPostsPanel(){
    return this.state.loading === true
      ? this.getLoadingMessage()
      : this.getPostList()
  }

  render() {
    return (<div style={{width: "100%", paddingBottom: 0, overflow: "hidden"}}>
            {this.renderHeader()}
            {this.renderPostsPanel()}
        </div>
    );
  }
}

export default App;

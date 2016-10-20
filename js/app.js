var CampaignList = React.createClass({
	render: function() {
		var _this = this;
		var createItem = (item, index) => {
			var rootClass = 'campaignItem';
			return (
				<div 
					className = {rootClass}
					key = { index }
					onClick = { () => { _this.props.onSelect(item) } }  
				>
					<div className={rootClass+'-title'}>{ item.title }</div>
					<pre className={rootClass+'-description'}>{ item.description }</pre>
				</div>
			);
		};
		return <div>
			<h2>Кампании</h2>
			{ _this.props.items.map(createItem) }
			<h2>Инициативи</h2>
			{ }
		</div>
	  }
	});

var App = React.createClass({
  mixins: [ReactFireMixin],

  getInitialState: function() {
    return {
      items: [],
	  user: null,
      text: ''
    };
  },

  componentWillMount: function() {
    var firebaseRef = firebase.database().ref('campaigns');
    this.bindAsArray(firebaseRef, 'campaigns');
	
	firebase.auth().onAuthStateChanged((user) => {
	  this.setState({user});
	});	
  },

  onChange: function(e) {
    this.setState({text: e.target.value});
  },

	handleSelectCampaign: (campaign) => {
		console.log(campaign.title + ' selected');
	},
  
  handleSubmit: function(e) {
    e.preventDefault();
    if (this.state.text && this.state.text.trim().length !== 0) {
      this.firebaseRefs['items'].push({
        text: this.state.text
      });
      this.setState({
        text: ''
      });
    }
  },

  render: function() {
    return (
		<div>
			<Header user={this.state.user}/>
			<div className='main'>
				<CampaignList items={ this.state.campaigns } onSelect={ this.handleSelectCampaign }/>
				<form onSubmit={ this.handleSubmit }>
				<input onChange={ this.onChange } value={ this.state.text } />
				<button>{ 'Add #' + (this.state.items.length + 1) }</button>
				</form>
			</div>
		</div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));
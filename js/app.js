function convertCurrency(amount, from, to) {
	return Currency.convert(amount, from, to);
}
function formatCurrency(amount, currency) {
	return amount.toFixed(0) + ' ' + currency.toUpperCase();
}

var CampaignList = React.createClass({
	render: function() {
		var createItem = (item, index) => {
			var rootClass = 'campaignItem';
			return (
				<div 
					className = {rootClass + ' ' + rootClass + '-' + (item.amount < item.targetAmount ? 'unmet' : 'met')}
					key = { index }
					onClick = { () => { this.props.onSelect(item) } }  
				>
					<div className={rootClass + '-header'}>
						<div className={rootClass+'-title'}>{ item.title } </div>
						<div className={rootClass+'-amount'}>{ formatCurrency(item.amount, 'BGN') + ' / ' + formatCurrency(item.targetAmount, 'BGN') }</div>
					</div>
					<pre className={rootClass+'-description'}>{ item.description }</pre>
				</div>
			);
		};
		return <div>
			<h2>Кампании</h2>
			{ this.props.items.map(createItem) }
		</div>
	  }
});

var InitiativeList = React.createClass({
	render: function() {
		var createItem = (item, index) => {
			var rootClass = 'campaignItem';
			return (
				<div 
					className = {rootClass + ' ' + rootClass + '-' + (item.amount.converted < item.targetAmount ? 'unmet' : 'met')}
					key = { index }
					onClick = { () => { this.props.onSelect(item) } }  
				>
					<div className={rootClass + '-header'}>
						<div className={rootClass+'-title'}>{ item.title } </div>
						<div className={rootClass+'-amount'}>{ formatCurrency(item.amount.converted, 'BGN') + ' / ' + formatCurrency(item.targetAmount, 'BGN') }</div>
					</div>
					<pre className={rootClass+'-description'}>{ item.description }</pre>
				</div>
			);
		};
		return <div>
			<h2>Инициативи</h2>
			{ this.props.items && this.props.items.map(createItem) }
		</div>
	  }
});

var App = React.createClass({
	mixins: [ReactFireMixin],

	getInitialState: function() {
		return {
		  campaigns: [],
		  initiatives: null,
		  selectedCampaign: null,
		  text: '',
		  user: null
		};
	},

	componentWillMount: function() {
		var firCampaignsRef = firebase.database().ref('campaigns');
		this.bindAsArray(firCampaignsRef, 'campaigns');
		
		firebase.auth().onAuthStateChanged((user) => {
		  this.setState({user});
		});	
	},

	onChange: function(e) {
		this.setState({text: e.target.value});
	},

	handleSelectCampaign: function(campaign) {
		if((this.state.campaign && this.state.campaign['.key']) !== (campaign && campaign['.key'])) {				
			this.setState({selectedCampaign: campaign});	
			
			var firInitiativesRef = firebase.database().ref('initiatives/simeonov');
			if (this.state.initiatives)
				this.unbind('initiatives');
			this.bindAsArray(firInitiativesRef, 'initiatives');
		}	
	},
	handleSelectInitiative: function(initiative) {
	},

  render: function() {
    return (
		<div>
			<Header user={this.state.user}/>
			{this.state.user &&
				<div className='main'>
					{<CampaignList items={ this.state.campaigns } onSelect={ this.handleSelectCampaign }/>}
					{this.state.selectedCampaign && <InitiativeList items={ this.state.initiatives } onSelect={ this.handleSelectInitiative }/>}
				</div>
			}
		</div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));
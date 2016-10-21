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
					className = {`${rootClass} 
						${rootClass}-${(item.amount < item.targetAmount ? 'unmet' : 'met')}
						${this.props.selected === item ? rootClass+'-selected' : ''}`}
					key = { index }
					onClick = { () => { this.props.onSelect(item) } }  
				>
					<div className={`${rootClass}-header`}>
						<div className={`${rootClass}-title`}>{ item.title } </div>
						<div className={`${rootClass}-amount`}>{ formatCurrency(item.amount, 'BGN') + ' / ' + formatCurrency(item.targetAmount, 'BGN') }</div>
					</div>
					<div className={`${rootClass}-description`}><pre>{ item.description }</pre></div>
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
					className = {`${rootClass} 
						${rootClass}-${(item.amount.converted < item.targetAmount ? 'unmet' : 'met')}
						${this.props.selected === item ? rootClass+'-selected' : ''}`}
					key = { index }
					onClick = { () => { this.props.onSelect(item) } }  
				>
					<div className={`${rootClass}-header`}>
						<div className={`${rootClass}-title`}>{ item.title } </div>
						<div className={`${rootClass}-amount`}>{ formatCurrency(item.amount.converted, 'BGN') + ' / ' + formatCurrency(item.targetAmount, 'BGN') }</div>
					</div>
					<pre className={`${rootClass}-description`}>{ item.description }</pre>
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
			selectedInitiative: null,
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

	getInitiativeAmount: function(currency) {
		var dict = this.state.selectedInitiative.amount[currency];
		return (dict && dict[this.state.user.uid]) || 0;
	},
	
	onChange: function(e) {
		this.setState({text: e.target.value});
	},

	handleSelectCampaign: function(campaign) {
		if((this.state.selectedCampaign && this.state.selectedCampaign['.key']) !== (campaign && campaign['.key'])) {				
			this.setState({
				selectedCampaign: campaign,
				selectedInitiative: null
			});	
			
			var firInitiativesRef = firebase.database().ref(`initiatives/${campaign['.key']}`);
			if (this.state.initiatives)
				this.unbind('initiatives');
			this.bindAsArray(firInitiativesRef, 'initiatives');
		}	
	},
	handleSelectInitiative: function(initiative) {
		if((this.state.selectedInitiative && this.state.selectedInitiative['.key']) !== (initiative && initiative['.key'])) {				
			this.setState({selectedInitiative: initiative});
		}	
	},

  render: function() {
    return (
		<div>
			<Header user={this.state.user}/>
			{this.state.user &&
				<div className='main'>
					<div className='top'>
						<div className='left'>{<CampaignList items={ this.state.campaigns } selected={this.state.selectedCampaign} onSelect={ this.handleSelectCampaign }/>}</div>
						<div className='center'/>
						<div className='right'>{this.state.selectedCampaign && <InitiativeList items={ this.state.initiatives } selected={this.state.selectedInitiative} onSelect={ this.handleSelectInitiative }/>}</div>
					</div>
					<div className='bottom'>
						<hr className='divider'/>
						{this.state.selectedInitiative && 
							<div className='contribution'>
								<b>Моя принос:</b>
								<div>BGN: <input value={this.getInitiativeAmount('BGN')}/></div>
								<div>EUR: <input value={this.getInitiativeAmount('EUR')}/></div>
								<div>USD: <input value={this.getInitiativeAmount('USD')}/></div>
								<button>Запази</button>
							</div>
						}
					</div>	
				</div>				
			}
		</div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));
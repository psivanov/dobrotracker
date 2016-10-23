function convertCurrency(amount, from, to) {
	return Currency.convert(amount, from, to);
}
function formatCurrency(amount, currency) {
	return amount.toFixed(0) + ' ' + currency.toUpperCase();
}

var CampaignList = React.createClass({
	deleteCampaign: function(key) {
		if(confirm('Сигурен ли си че искаш да изтриеш тази кампания?')) {
			firebase.database().ref(`campaigns/${key}`).remove();
		}
	},
	render: function() {
		var createItem = (item, index) => {
			var rootClass = 'campaignItem';
			return (
				<div className={rootClass} key = { index }>
					<div 
						className = {`${rootClass}-main 
							${rootClass}-${(item.amount < item.targetAmount ? 'unmet' : 'met')}
							${this.props.selected === item['.key'] ? rootClass+'-selected' : ''}`}
						onClick = { () => { this.props.onSelect(item['.key']) } }  
					>
						<div className={`${rootClass}-header`}>
							<div className={`${rootClass}-title`}>{ item.title } </div>
							<div className={`${rootClass}-amount`}>{ formatCurrency(item.amount, 'BGN') + ' / ' + formatCurrency(item.targetAmount, 'BGN') }</div>
						</div>
						<div className={`${rootClass}-description`}><pre>{ item.description }</pre></div>
					</div>
					{ item.owners[this.props.user.uid] && item.amount === 0 && <div className={`${rootClass}-delete`} onClick={() => this.deleteCampaign(item['.key'])}/> }
				</div>
			);
		};
		return <div>
			{ this.props.items.map(createItem) }
		</div>
	  }
});

var InitiativeList = React.createClass({
	deleteInitiative: function(key) {
		if(confirm('Сигурен ли си че искаш да изтриеш тази инициатива?')) {
			firebase.database().ref(`initiatives/${this.props.selectedCampaign}/${key}`).remove();
		}
	},
	render: function() {
		var createItem = (item, index) => {
			var rootClass = 'campaignItem'; //initiatives uses the campaign CSS classes, since the UI is the same
			return (
				<div className={rootClass}>
					<div 
						className = {`${rootClass}-main 
							${rootClass}-${(item.amount.converted < item.targetAmount ? 'unmet' : 'met')}
							${this.props.selected === item['.key'] ? rootClass+'-selected' : ''}`}
						key = { index }
						onClick = { () => { this.props.onSelect(item['.key']) } }  
					>
						<div className={`${rootClass}-header`}>
							<div className={`${rootClass}-title`}>{ item.title } </div>
							<div className={`${rootClass}-amount`}>{ formatCurrency(item.amount.converted, 'BGN') + ' / ' + formatCurrency(item.targetAmount, 'BGN') }</div>
						</div>
						<pre className={`${rootClass}-description`}>{ item.description }</pre>
					</div>
					{ this.props.canDelete && <div className={`${rootClass}-delete`} onClick={() => this.deleteInitiative(item['.key'])}/> }
				</div>
			);
		};
		return <div>
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

	getInitiativeAmount: function(initiative, currency) {
		var dict = initiative && initiative.amount[currency];
		return (dict && dict[this.state.user.uid]) || 0;
	},

	getSelectedCampaign: function() {
		return this.state.campaigns && this.state.campaigns.find(x => x['.key'] === this.state.selectedCampaign);
	},	
	getSelectedInitiative: function() {
		return this.state.initiatives && this.state.initiatives.find(x => x['.key'] === this.state.selectedInitiative);
	},
	
	handleContributionChange: function(e, currency) {
		var contribution = this.state.contribution;
		contribution[currency] = e.target.value;
		this.setState({contribution});
	},
	
	handleSelectCampaign: function(campaign) {
		if(this.state.selectedCampaign !== campaign) {
			this.setState({
				selectedCampaign: campaign,
				selectedInitiative: null
			});

			//initiatives
			var firInitiativesRef = firebase.database().ref(`initiatives/${campaign}`);
			if (this.state.initiatives)
				this.unbind('initiatives');
			this.bindAsArray(firInitiativesRef, 'initiatives');
		}	
	},
	handleSelectInitiative: function(initiative) {
		if(this.state.selectedInitiative !== initiative) {
			this.setState({selectedInitiative: initiative});
			this.syncContribution(this.state.initiatives.find(x => x['.key'] === initiative));
		}	
	},
	handleUpdateContribution: function() {
		var bgnIncrement = this.state.contribution.BGN - this.getInitiativeAmount(this.getSelectedInitiative(), 'BGN');
		var eurIncrement = this.state.contribution.EUR - this.getInitiativeAmount(this.getSelectedInitiative(), 'EUR');
		var usdIncrement = this.state.contribution.USD - this.getInitiativeAmount(this.getSelectedInitiative(), 'USD');
		var converted = bgnIncrement + convertCurrency(eurIncrement, 'EUR', 'BGN') + convertCurrency(usdIncrement, 'USD', 'BGN');
		//get user id
		var uid = this.state.user.uid;
		//get ref to initiative amount
		var amountRef = firebase.database().ref(`initiatives/${this.state.selectedCampaign}/${this.state.selectedInitiative}/amount`);
		//getRef to campaign
		var campaignRef = firebase.database().ref(`campaigns/${this.state.selectedCampaign}/amount`);	
		if(bgnIncrement !== 0)
			amountRef.child(`BGN/${uid}`).transaction(currentData => this.firAdd(currentData, bgnIncrement));
		if(eurIncrement !== 0)
			amountRef.child(`EUR/${uid}`).transaction(currentData => this.firAdd(currentData, eurIncrement));
		if(usdIncrement !== 0)
			amountRef.child(`USD/${uid}`).transaction(currentData => this.firAdd(currentData, usdIncrement));
		if(converted !== 0) {
			amountRef.child('converted').transaction(currentData => this.firAdd(currentData, converted));
			campaignRef.transaction(currentData => this.firAdd(currentData, converted));
		}			
	},
	firAdd: function(currentData, increment) {
		if(!currentData)
			currentData = 0;
		return currentData + increment;
	},
	syncContribution: function(initiativeObj) {
		this.setState({
			contribution: {
				BGN: this.getInitiativeAmount(initiativeObj, 'BGN'),
				EUR: this.getInitiativeAmount(initiativeObj, 'EUR'),
				USD: this.getInitiativeAmount(initiativeObj, 'USD')
			}
		});
	},

  render: function() {
	var user = this.state.user;
	var campaign = this.getSelectedCampaign();
    return (
		<div>
			<Header user={user}/>
			{user &&
				<div className='main'>
					<div className='top'>
						<div className='left'>
							<h2>Кампании</h2>
							{<CampaignList 
								items={ this.state.campaigns } 
								onSelect={ this.handleSelectCampaign }
								selected={this.state.selectedCampaign}
								user={user}
							/>}
						</div>
						<div className='center'><hr style={{width:'1px', height:'100%'}}/></div>
						<div className='right'>
							<h2>Инициативи</h2>
							{campaign && <InitiativeList
									canDelete={ campaign && campaign.owners[user.uid] && campaign.amount === 0 }
									items={ this.state.initiatives } 
									selected={this.state.selectedInitiative}
									selectedCampaign={this.state.selectedCampaign}
									onSelect={ this.handleSelectInitiative }
							/>}
						</div>
					</div>
					<div className='bottom'>
						<hr className='divider'/>
						{this.state.selectedInitiative && 
							<div className='contribution'>
								<b>Моя принос:</b>
								<div>BGN: <input value={this.state.contribution.BGN} onChange={(e) => this.handleContributionChange(e, 'BGN')}/></div>
								<div>EUR: <input value={this.state.contribution.EUR} onChange={(e) => this.handleContributionChange(e, 'EUR')}/></div>
								<div>USD: <input value={this.state.contribution.USD} onChange={(e) => this.handleContributionChange(e, 'USD')}/></div>
								<button onClick={this.handleUpdateContribution}>Запази</button>
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
function convertCurrency(amount, from, to) {
	return Currency.convert(amount, from, to);
}
function formatCurrency(amount, currency) {
	return `${amount.toFixed(0)} ${currency.toUpperCase()}`;
}

var CampaignList = React.createClass({
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
						<div className={`${rootClass}-description`}>
							{`(Създаденa на ${new Date(item.date).toLocaleDateString()} от ${item.creator})`}
							<pre>{ item.description }</pre>
						</div>
					</div>
					{ item.owners[this.props.user.uid] && item.amount === 0 && <div className={`${rootClass}-delete`} onClick={() => this.props.deleteCampaign(item['.key'])}/> }
				</div>
			);
		};
		return <div>
			{ this.props.items.map(createItem).reverse() }
		</div>
	  }
});

var InitiativeList = React.createClass({
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
						<div className={`${rootClass}-description`}>
							{`(Създаденa на ${new Date(item.date).toLocaleDateString()})`}
							<pre>{ item.description }</pre>
						</div>
					</div>
					{ this.props.canDelete && <div className={`${rootClass}-delete`} onClick={() => this.props.deleteInitiative(item['.key'])}/> }
				</div>
			);
		};
		return <div>
			{ this.props.items && this.props.items.map(createItem).reverse() }
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
	componentDidMount: function() {
		this.displayFirebaseUiLogin();
	},
	componentDidUpdate: function() {
		this.state.shouldDisplayFirebaseUiLogin && this.displayFirebaseUiLogin();
	},	
	
	componentWillMount: function() {
		var firCampaignsRef = firebase.database().ref('campaigns').orderByChild('date');
		this.bindAsArray(firCampaignsRef, 'campaigns');
		
		firebase.auth().onAuthStateChanged((user) => {
		  this.setState({
			email: '',
			password: '',
			loginError: '',
			user
		  });
		});

		this.initFirebaseUiLogin();
	},

	//<auth>
	firebaseUi: null,
	firebaseUiConfig: null,
	initFirebaseUiLogin: function() {
      // FirebaseUI config.
      this.firebaseUiConfig = {
		signInFlow: 'popup',
        signInOptions: [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
          //firebase.auth.GithubAuthProvider.PROVIDER_ID
        ]
      };

      // Initialize the FirebaseUI Widget using Firebase.
      this.firebaseUi = new firebaseui.auth.AuthUI(firebase.auth());
	},
	displayFirebaseUiLogin: function() {
		!this.state.user && this.firebaseUi.start('#firebase-ui-container', this.firebaseUiConfig);	
	},
	anonymousLogin: function() {
		firebase.auth().signInAnonymously().catch((error) => {
			this.setState({loginError: error.message});
		});
	},	
	logout: function() {
		firebase.auth().signOut()
		.then(() => {
			this.setState({
				selectedCampaign: null,
				selectedInitiative: null,
				shouldDisplayFirebaseUiLogin: true
			});
		})
		.catch((error) => {
			this.setState({loginError: error.message});
		});
	},	
	//</auth>
	
	deleteCampaign: function(campaign) {
		if(confirm('Сигурен ли си че искаш да изтриеш тази кампания?')) {
			firebase.database().ref(`campaigns/${campaign}`).remove();
			firebase.database().ref(`initiatives/${campaign}`).remove();
			
			if(this.state.selectedCampaign === campaign)
				this.syncSelection(null, null);
		}
	},	
	deleteInitiative: function(initiative) {
		if(confirm('Сигурен ли си че искаш да изтриеш тази инициатива?')) {
			firebase.database().ref(`initiatives/${this.state.selectedCampaign}/${initiative}`).remove();
			
			if(this.state.selectedInitiative === initiative)
				this.syncSelection(this.state.selectedCampaign, null);			
		}
	},	

	getInitiativeAmount: function(initiative, currency) {
		var dict = initiative && initiative.amount[currency];
		return (dict && dict[this.state.user.uid]) || 0;
	},

	getCampaign: function(campaign) {
		if(!campaign) campaign = this.state.selectedCampaign;
		return this.state.campaigns && this.state.campaigns.find(x => x['.key'] === campaign);
	},	
	getInitiative: function(initiative) {
		if(!initiative) initiative = this.state.selectedInitiative;
		return this.state.initiatives && this.state.initiatives.find(x => x['.key'] === initiative);
	},
	getUserDisplay: function() {
		var user = this.state.user;
		return user.displayName ? user.displayName : user.email;
	},
	
	handleChange: function(e, name) {
		this.setState({ [name]: e.target.value });
	},
	handleContributionChange: function(e, currency) {
		var contribution = this.state.contribution; 
		contribution[currency] = e.target.value;
		this.setState({contribution});
	},
	handleEdit: function() {
		var campaign = this.state.selectedCampaign;
		var initiative = this.state.selectedInitiative;
		if(campaign) {
			var refCampaign = firebase.database().ref(`campaigns/${campaign}`);
			
			if(!initiative) {
				refCampaign.update({
					description: this.state.editDescription,
					title: this.state.editTitle
				});
			}
			else {
				var refInitiative = firebase.database().ref(`initiatives/${campaign}/${initiative}`);	

				refInitiative.update({
					description: this.state.editDescription,
					title: this.state.editTitle
				});
				
				var initiativeObj = this.getInitiative(initiative);
				var increment = (+this.state.editTargetAmount || 0) - initiativeObj.targetAmount;
				if (increment !== 0) {
					refInitiative.child('targetAmount').transaction(currentData => this.firAdd(currentData, increment));
					refCampaign.child('targetAmount').transaction(currentData => this.firAdd(currentData, increment));
				}					
			}
			
			this.syncSelection(campaign, initiative);				
		}
	},
	handleNewCampaign: function() {
		var newRef = firebase.database().ref('campaigns').push({
			amount: 0,
			creator: this.getUserDisplay(),
			date: (new Date).toISOString(),
			description: '--Подробно описание на кампанията--',
			owners: { [this.state.user.uid]: true },
			targetAmount: 0,
			title: '--Име на кампанията--'
		});
		
		this.handleSelectCampaign(newRef.key);
	},
	handleNewInitiative: function(campaign) {
		var newRef = firebase.database().ref(`initiatives/${campaign}`).push({
			amount: { BGN:{}, EUR:{}, USD:{}, converted: 0 },
			date: (new Date).toISOString(),
			description: '--Подробно описание на инициативата--',
			targetAmount: 0,
			title: '--Име на инициативата--'
		});
		
		this.handleSelectInitiative(newRef.key);	
	},
	
	handleSelectCampaign: function(campaign) {
		if(campaign) {
			//initiatives
			var firInitiativesRef = firebase.database().ref(`initiatives/${campaign}`).orderByChild('date');
			if (this.state.initiatives)
				this.unbind('initiatives');
			this.bindAsArray(firInitiativesRef, 'initiatives');			
		}
		this.syncSelection(campaign, null);
	},
	handleSelectInitiative: function(initiative) {
		if(this.state.selectedInitiative !== initiative) {
			this.syncSelection(this.state.selectedCampaign, initiative);
		}	
	},
	handleUpdateContribution: function() {
		var bgnIncrement = (+this.state.contribution.BGN || 0) - this.getInitiativeAmount(this.getInitiative(), 'BGN');
		var eurIncrement = (+this.state.contribution.EUR || 0) - this.getInitiativeAmount(this.getInitiative(), 'EUR');
		var usdIncrement = (+this.state.contribution.USD || 0) - this.getInitiativeAmount(this.getInitiative(), 'USD');
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
	syncSelection: function(campaign, initiative) {
		var editTitle, editDescription, editTargetAmount;
	
		var campaignObj = campaign && this.getCampaign(campaign);
		if(campaignObj) {
			editDescription = campaignObj.description;
			editTargetAmount = campaignObj.targetAmount;
			editTitle = campaignObj.title;	
		}
		else
			campaign = null;

		var initiativeObj = initiative && this.getInitiative(initiative);
		if(initiativeObj) {
			editDescription = initiativeObj.description;
			editTargetAmount = initiativeObj.targetAmount;
			editTitle = initiativeObj.title;	
		}
		else
			initiative = null;
			
		this.setState({
			contribution: {
				BGN: this.getInitiativeAmount(initiativeObj, 'BGN'),
				EUR: this.getInitiativeAmount(initiativeObj, 'EUR'),
				USD: this.getInitiativeAmount(initiativeObj, 'USD')
			},
			editDescription,
			editTargetAmount,
			editTitle,				
			selectedCampaign: campaign,
			selectedInitiative: initiative
		});
	},

  render: function() {
	var user = this.state.user;
	var campaign = this.getCampaign();
	var initiative = this.getInitiative();
	var owner = campaign && this.state.user && campaign.owners[this.state.user.uid];
    return (
		<div>
			<div className='header'>
				<div className='header-left'>
					ДоброТракер
				</div>
				<div className='header-right'>
					{user && <div>
						<a style={{margin: '8px'}}>{this.getUserDisplay()}</a><button onClick={this.logout}>{'Изход'}</button>
					</div>}						
				</div>			
			</div>
			{!user &&
				<div className='login-main'>
					<div className='login-anonymous'>
						<button style={{width:'100%', height: '100%'}} onClick={this.anonymousLogin}>{'Анонимен Вход'}</button>
					</div>
					<div className='login-firUi' id='firebase-ui-container'/>
				</div>
			}
			{user &&
				<div className='main'>
					<div className='top'>
						<div className='left'>
							<h2>Кампании
								{!user.isAnonymous && <button style={{float:'right'}} onClick={this.handleNewCampaign}>Нова Кампания</button>}
							</h2>
							{<CampaignList
								deleteCampaign={this.deleteCampaign}
								items={ this.state.campaigns } 
								onSelect={ this.handleSelectCampaign }
								selected={this.state.selectedCampaign}
								user={user}
							/>}
						</div>
						<div className='center'><hr style={{width:'1px', height:'100%'}}/></div>
						<div className='right'>
							<h2>Инициативи 
								{!user.isAnonymous && owner && <button style={{float:'right'}} onClick={() => this.handleNewInitiative(campaign['.key'])}>Нова Инициатива</button>}
							</h2>
							{campaign && <InitiativeList
									canDelete={ campaign && campaign.owners[user.uid] && campaign.amount === 0 }
									deleteInitiative={this.deleteInitiative}
									items={ this.state.initiatives } 
									selected={this.state.selectedInitiative}
									selectedCampaign={this.state.selectedCampaign}
									onSelect={ this.handleSelectInitiative }
							/>}
						</div>
					</div>
					<div className='bottom'>
						<hr className='divider'/>
						{owner && 
							<div className='edit'>
								<b>Редактирай:</b>
								<div style={{flex:4}}>
									Име:<br/>
									<textarea value={this.state.editTitle} rows='1' onChange={(e) => this.handleChange(e, 'editTitle')}/>
								</div>
								<div style={{flex:4}}>
									Описание:<br/>
									<textarea value={this.state.editDescription} rows='8' onChange={(e) => this.handleChange(e, 'editDescription')}/>
								</div>
								{initiative && <div style={{flex:1}}>
									Необходима сума:<br/>
									<textarea value={this.state.editTargetAmount} rows='1' onChange={(e) => this.handleChange(e, 'editTargetAmount')}/>
								</div>}
								<button 
									disabled={!this.state.editTitle || !this.state.editDescription} 
									onClick={this.handleEdit}
									style={{height: '21px'}}
								>Запази</button>						
							</div>
						}
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
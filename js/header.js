var Header = React.createClass({
	login: function() {
		// Instantiate the Google authentication provider
		var provider= new firebase.auth.GoogleAuthProvider();
		// Handle the authentication request using the Popup method
		firebase.auth().signInWithPopup(provider).catch(function(error) {
			console.log(error);
		});						
	},
	anonymousLogin: function() {
		firebase.auth().signInAnonymously().catch(function(error) {
			console.log(error);
		});
	},
	logout: function() {
		firebase.auth().signOut().catch(function(error) {
			console.log(error);
		});	
	},	
	
	componentWillReceiveProps: function(nextProps) {
	},	

	render: function() {
		var rootClass = 'header';
		var user = this.props.user;
		return <div className={rootClass}>
			<div className={rootClass+'-left'}>
				ДоброТракер
			</div>
			<div className={rootClass+'-right'}>
				{user
					? <div><span style={{margin: '8px'}}>{user.displayName ? user.displayName : user.email}</span><button onClick={this.logout}>{'Изход'}</button></div>
					: <div><button style={{marginRight: '8px'}} onClick={this.login}>{'Вход'}</button><button onClick={this.anonymousLogin}>{'Анонимен Вход'}</button></div>
				}						
			</div>			
		</div>;
	}
});
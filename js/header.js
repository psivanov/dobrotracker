var Header = React.createClass({
	login: () => {
		// Instantiate the Google authentication provider
		var provider= new firebase.auth.GoogleAuthProvider();
		// Handle the authentication request using the Popup method
		firebase.auth().signInWithPopup(provider).catch(function(error) {
			console.log(error);
		});						
	},
	logout: () => {
		firebase.auth().signOut().catch(function(error) {
			console.log(error);
		});	
	},	
	
	componentWillReceiveProps: function(nextProps) {
		if(nextProps.user)
			console.log(nextProps.user);
		else
			console.log('loged out');
	},	

	render: function() {
		var rootClass = 'header';
		var user = this.props.user;
		return <div>
			<h2 style={{
				color: 'red'
			}}>Quick Prototype (don't use yet)</h2>
			<div className={rootClass}>
				<div className={rootClass+'-left'}>
					ДоброТракер
				</div>
				<div className={rootClass+'-right'}>
					{user
						? <div><span style={{margin: '8px'}}>{user.displayName ? user.displayName : user.email}</span><button onClick={this.logout}>{'Logout'}</button></div>
						: <button onClick={this.login}>{'Login'}</button>
					}						
				</div>			
			</div>
		</div>;
	}
});
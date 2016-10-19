var Header = React.createClass({
  render: function() {
    return <div>
		<h2 style={{
			color: 'red'
		}}>Quick Prototype (don't use yet)</h2>
		<h1>ДоброТракер</h1>
	</div>;
  }
});

ReactDOM.render(<Header />, document.getElementById('header'));
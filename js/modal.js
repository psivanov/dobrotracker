var Modal = React.createClass({
	render: function() {
		return (
			<div className={`modal ${this.props.isOpen ? 'modal--isOpen' : ''}`}>
				<div className='modal-content'>
					{this.props.children}
					<div className='modal-buttons'>
						<button onClick={this.onClose}>{'Откажи'}</button>
						<button onClick={this.onOk}>{'Потвърди'}</button>
					</div>
				</div>
			</div>
		)
	}
});
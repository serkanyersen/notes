/** @jsx React.DOM */
var core = new Core();

var NotesList = React.createClass({
  render: function() {
    var createItem = function(note) {
      return <li key={note.url}><a  href={'#' + note.url}>{note.title}</a></li>;
    };
    return <ul>{this.props.notes.map(createItem)}</ul>;
  }
});

var NoteEditor = React.createClass({
  getInitialState: function() {
    return {value: this.props.value};
  },
  getDefaultProps: function() {
    return {value: 'note'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function(){
    return <textarea onChange={this.handleChange} style={{height:'100%', width:'100%'}} value={this.state.value}></textarea>;
  }
});

var Notes = React.createClass({
  getInitialState: function() {
      return {notes: []};
  },

  getNote: function(hash) {
    core.getNote(hash);
  },

  openNote: function(snapshot) {
    var note = snapshot.val();
    React.renderComponent(
      <NoteEditor value={note.body} />,
      document.getElementById('editor')
    );
  },

  componentWillMount: function() {

    window.addEventListener('hashchange', function() {
      this.getNote(window.location.hash.replace('#', ''));
    }.bind(this));

    if(window.location.hash) {
      this.getNote(window.location.hash.replace('#', ''));
    }

    core.events.on('note:read', function(snapshot) {
      this.openNote(snapshot);
    }.bind(this));

    core.events.on('notes:read', function() {
      this.setState({
        notes: core.getNoteList()
      });
    }.bind(this));
  },

  render: function () {
    return (
      <NotesList notes={this.state.notes} />
    );
  }
});


React.renderComponent(
  <Notes />,
  document.getElementById('list')
);

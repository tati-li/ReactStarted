let mainBox = document.getElementById('app');
ReactDom.render(<div><img src='https://pixabay.com/static/uploads/photo/2014/10/23/20/24/guinea-pig-500236_960_720.jpg' /> <div id="image-holder"></div></div>, mainBox);

class Photo extends React.Component {

  static propTypes = {
    imgSrc: React.PropTypes.string,
    caption: React.PropTypes.string.isRequired
  };

  static defaultProps = {
    caption: 'Hi!!'
  };

  /**
   *
   * @returns {XML}
   */
  render() {
    return (
      <div class="photo">
        <img src={this.props.imgSrc} />
        <span>{this.props.caption}</span>
      </div>
    );
  }

}

ReactDom.render(
  <Photo
    imgSrc="https://pixabay.com/static/uploads/photo/2014/01/11/23/40/guinea-pig-242520_960_720.jpg"
  />,
  document.getElementById('image-holder')
);

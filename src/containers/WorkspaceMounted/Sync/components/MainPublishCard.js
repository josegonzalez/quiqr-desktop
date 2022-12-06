import React from 'react';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';


const useStyles = theme => ({
  root: {
    margin: 20,
    maxWidth: 545,
  },
  logo:{
    alignItems: 'center',
    width: "100%",
    backgroundColor: '#ccc',
    justifyContent: 'center',
    height: 100,
    padding: 30,
    '&> svg': {
    }
  },
  media: {
  },
});

class MainPublishCard extends React.Component {

  constructor(props){
    super(props);
    this.state = {
    };
  }

  render(){
    const { classes } = this.props;

    return (
      <Card className={classes.root}
      elevation={5}
      >
        <CardHeader
          avatar={ null }
          action={
            this.props.itemMenu
          }
          title={<div >{this.props.title}<br/><Button color="primary" onClick={()=>{
            window.require('electron').shell.openExternal(this.props.liveURL);
          }}>{this.props.liveURL}</Button>{
            (this.props.repoAdminUrl!=='' ?
              <React.Fragment><br/><Button color="primary" onClick={()=>{
                window.require('electron').shell.openExternal(this.props.repoAdminUrl);
              }}>{this.props.repoAdminUrl}</Button></React.Fragment>
              : null)

          }</div>}
          subheader=""
        />

        <div className={classes.logo}>
          {this.props.serviceLogo}
        </div>
        <CardContent>
        </CardContent>
        <CardActions>
          { this.props.enableSyncTo === true ?
          <Button variant="contained" color="primary" onClick={()=>{this.props.onPublish()}}>
            Push
          </Button>
          : null
          }
          { this.props.enableSyncFrom === true ?
          <Button variant="contained" color="secondary" onClick={()=>{this.props.onMerge()}}>
            Pull
          </Button>
          : null
          }
        </CardActions>
      </Card>
    );
  }
}

export default withStyles(useStyles)(MainPublishCard);


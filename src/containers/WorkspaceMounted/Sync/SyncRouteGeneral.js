import React            from 'react';
import { Route }        from 'react-router-dom';
import service          from './../../../services/service';
import Typography       from '@material-ui/core/Typography';
import { withStyles }   from '@material-ui/core/styles';
import MainPublishCard  from './components/MainPublishCard';
import SyncServerDialog from './components/SyncServerDialog';
import LogoQuiqrCloud   from './components/quiqr-cloud/LogoQuiqrCloud';
import IconButton       from '@material-ui/core/IconButton';
import MoreVertIcon     from '@material-ui/icons/MoreVert';
import Menu             from '@material-ui/core/Menu';
import MenuItem         from '@material-ui/core/MenuItem';
import Button           from '@material-ui/core/Button';


const useStyles = theme => ({

  container:{
    padding: '20px',
    height: '100%'
  },

  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '50ch',
  },

});

class SyncRouteGeneral extends React.Component {

  history: any;

  constructor(props){
    super(props);
    this.state = {
      site : {
        publish: []
      },
      serverDialog: {},

    };
  }

  componentDidUpdate(preProps){

    if(this.state.addRefresh !== this.props.addRefresh) {
      this.openAddServerDialog();
     }

    if(preProps.site !== this.props.site) {
      this.initState();
    }
  }

  componentDidMount(){
    this.initState();
  }

  openAddServerDialog(){
     this.setState({
        addRefresh: this.props.addRefresh,
        serverDialog: {
          open:true,
          modAction: "Add",
          serverTitle: "Sync Server",
          closeText: "Cancel"
        }
      })
  }

  initState(){

    if(this.props.site){
      this.setState({
        site: this.props.site
      });
    }
  }

  savePublishData(key,data){
    let site= this.state.site;
    let encodedSiteKey = this.props.siteKey;
    let encodedWorkspaceKey = this.props.workspaceKey;

    if(!key){
      key = `publ-${Math.random()}`;
    }

    const publConfIndex = site.publish.findIndex( ({ k }) => k === key );
    if(publConfIndex !== -1){
      site.publish[publConfIndex] = {key:key, config: data};
    }
    else{
      site.publish.push({key:key, config: data});
    }

    service.api.saveSiteConf(this.state.site.key, this.state.site).then(()=>{
      let basePath = `/sites/${encodedSiteKey}/workspaces/${encodedWorkspaceKey}/sync`;
      this.history.push(`${basePath}/list/${key}`)
    });

  }

  renderMainCard(publishConf){

    return <MainPublishCard
    publishPath={publishConf.config.path}
    liveURL={"https://"+publishConf.config.defaultDomain}
    serviceLogo={<LogoQuiqrCloud />}
    onPublish={()=>{
      service.api.logToConsole(publishConf, "pupConf");
    }}
    itemMenu={
      <div>
      <IconButton
      onClick={(event)=>{
        this.setState({anchorEl:event.currentTarget, menuOpen:publishConf.key})
      }}
      aria-label="more"
      aria-controls="long-menu"
      aria-haspopup="true"
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={this.state.anchorEl}
        open={(this.state.menuOpen===publishConf.key?true:false)}
        keepMounted
        onClose={()=>{
          this.setState({menuOpen:null});

        }}
      >
        <MenuItem key="edit"
          onClick={
            ()=>{
              this.setState({
                menuOpen:null,
                serverDialog: {
                  open:true,
                  modAction: "Edit",
                  serverTitle: "Quiqr Cloud Server",
                  closeText: "Close"
                }
              })
            }
          }
        >
          Edit
        </MenuItem>

        <MenuItem key="delete"
          onClick={
            ()=>{
              this.setState({
                menuOpen:null,
              })
            }
          }>
          Delete
        </MenuItem>
      </Menu>
      </div>
    }

      />
  }

  render(){
    const { site, serverDialog } = this.state;
    let encodedSiteKey = this.props.siteKey;
    let encodedWorkspaceKey = this.props.workspaceKey;

    let content = null;

    if(site.publish.length < 1){
      //no target setup yet
      content = (

        <div><p>No sync server is configured. Add one first.</p>
          <Button onClick={()=>{
            let basePath = `/sites/${encodedSiteKey}/workspaces/${encodedWorkspaceKey}/sync`;
            this.history.push(`${basePath}/add/x${Math.random()}`)
          }} color="primary" variant="contained">add sync server</Button>
        </div>
    )
    }
    else if(site.publish.length === 1){
      //show first target
      content = this.renderMainCard(site.publish[0])
    }
    else{
      //get last used target of syncConfKey
    }

    return (
      <Route render={({history})=>{

        this.history = history;
        return (

          <React.Fragment>
            <div className={ this.props.classes.container }>
              <Typography variant="h5">Sync Website - {this.state.site.name}</Typography>
              <span>{this.props.syncConfKey}</span>

              {content}

            </div>

            <SyncServerDialog
              {...serverDialog}
              onSave={(publishKey,publishConfig)=>{
                this.savePublishData(publishKey,publishConfig);
                this.setState({serverDialog: {
                  open:false
                }})

              }}
              onClose={()=>{
                this.setState({serverDialog: {
                  open:false
                }})
              }}

            />

          </React.Fragment>
        )
      }}/>
    );
  }
}

export default withStyles(useStyles)(SyncRouteGeneral);

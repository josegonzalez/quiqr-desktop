import React                   from 'react';
import { Route }               from 'react-router-dom';
import { withStyles }          from '@material-ui/core/styles';
import IconButton              from '@material-ui/core/IconButton';
import MoreVertIcon            from '@material-ui/icons/MoreVert';
import Menu                    from '@material-ui/core/Menu';
import MenuItem                from '@material-ui/core/MenuItem';
import Button                  from '@material-ui/core/Button';
import Box                     from '@material-ui/core/Box';
import FolderIcon              from '@material-ui/icons/Folder';
import GitHubIcon              from '@material-ui/icons/GitHub';
import MainPublishPage         from './components/MainPublishPage';
import SyncServerDialog        from './components/SyncServerDialog';
import SyncBusyDialog          from './components/SyncBusyDialog';
import { snackMessageService } from './../../../services/ui-service';
import SnackbarManager         from './../../../components/SnackbarManager';
import service                 from './../../../services/service';

const useStyles = theme => ({

  container:{
    xheight: '100%'
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
      serverBusyDialog: {},
      lastOpenedPublishedKey: null,
    };
  }

  componentDidUpdate(preProps){

    if(this.state.addRefresh !== this.props.addRefresh) {
      this.openAddServerDialog();
    }

    if(preProps.site !== this.props.site) {
      this.initState();
      this.checkLastOpenedPublishConf();
    }
  }

  componentDidMount(){
    this.initState();
    this.checkLastOpenedPublishConf();
    this.basePath = `/sites/${this.props.siteKey}/workspaces/${this.props.workspaceKey}/sync`;
  }

  checkLastOpenedPublishConf(){
    service.api.readConfKey('lastOpenedPublishTargetForSite').then((value)=>{
      if(value){
        if(this.props.siteKey in value){
          this.setState({lastOpenedPublishedKey: value[this.props.siteKey]});
        }
      }
    });
  }

  openAddServerDialog(){
    this.setState({
      addRefresh: this.props.addRefresh,
      serverDialog: {
        open:true,
        modAction: "Add",
        serverTitle: "Sync Target",
        closeText: "Cancel"
      }
    })
  }

  onConfigure(publishConf){
    this.setState({
      menuOpen:null,
      serverDialog: {
        open:true,
        modAction: "Edit",
        closeText: "Cancel",
        publishConf: publishConf
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

  mergeAction(publishConf){
    this.setState({
      serverBusyDialog: {
        open:true,
        serverType: publishConf.config.type,
      }
    })

    service.api.mergeSiteWithRemote(this.props.siteKey, publishConf).then(()=>{
      this.setState({
        serverBusyDialog: {
          open:false,
          serverType: null,
        }
      })
      snackMessageService.addSnackMessage('Sync from finished.');

    }).catch((e)=>{
      service.api.logToConsole(e ,"mergefail");
      snackMessageService.addSnackMessage('Sync from failed.');
      this.setState({
        serverBusyDialog: {
          open:false,
          serverType: null,
        }
      })
    });

  }

  publishAction(publishConf){
    const build=null;

    this.setState({
      serverBusyDialog: {
        open:true,
        serverType: publishConf.config.type,
      }
    })

    service.api.buildWorkspace(this.props.siteKey, this.props.workspaceKey, build, publishConf.config).then(()=>{

      service.api.publishSite(this.props.siteKey, publishConf).then(()=>{
        this.setState({
          serverBusyDialog: {
            open:false,
            serverType: null,
          }
        })

        snackMessageService.addSnackMessage('Sync to finished.');
      }).catch(()=>{
        snackMessageService.addSnackMessage('Sync to failed.');
        this.setState({
          serverBusyDialog: {
            open:false,
            serverType: null,
          }
        })
      });
    });
  }

  savePublishData(inkey,data){
    let site= this.state.site;

    if(!inkey){
      inkey = `publ-${Math.random()}`;
    }

    const publConfIndex = site.publish.findIndex( ({ key }) => key === inkey );
    if(publConfIndex !== -1){
      site.publish[publConfIndex] = {key:inkey, config: data};
    }
    else{
      site.publish.push({key:inkey, config: data});
    }

    service.api.saveSiteConf(this.state.site.key, this.state.site).then(()=>{
      this.history.push(`${this.basePath}/list/${inkey}`)
    });
  }

  renderMainCard(publishConf){

    let serviceLogo, title, liveUrl, syncToText, syncFromText;
    let repoAdminUrl = '';
    let enableSyncFrom = false;
    let enableSyncTo = true;

    if(publishConf.config.publishScope === 'source' ||publishConf.config.publishScope === 'build_and_source' ){
      enableSyncFrom = true;
    }
    if(publishConf.config.pullOnly === true){
      enableSyncTo = false;
    }

    if(publishConf.config.type === 'github'){

      serviceLogo = <GitHubIcon fontSize="large"  style={{margin:'6px'}}/>
      title = publishConf.config.username +"/" + publishConf.config.repository;
      repoAdminUrl= `https://github.com/${publishConf.config.username}/${publishConf.config.repository}`

      syncToText = 'Push to remote';
      syncFromText = 'Push from remote';


      if(publishConf.config.CNAME){
        liveUrl= `https://${publishConf.config.CNAME}`
      }
      else if(publishConf.config.setGitHubActions){
        liveUrl= `https://${publishConf.config.username}.github.io/${publishConf.config.repository}`
      }
      else{
        liveUrl= ''
      }
    }
    else if(publishConf.config.type === 'folder'){
      serviceLogo = <FolderIcon fontSize="medium" style={{marginRight:'6px'}}/>
      title = publishConf.config.path;
      liveUrl= '';
      syncToText = 'Publish to folder';
    }

    return <MainPublishPage
      title={title}
      liveURL={liveUrl}
      repoAdminUrl={repoAdminUrl}
      serviceLogo={serviceLogo}
      enableSyncFrom={enableSyncFrom}
      enableSyncTo={enableSyncTo}
      syncToText={syncToText}
      syncFromText={syncFromText}

      onConfigure={()=>{
        this.onConfigure(publishConf);
      }}

      onMerge={()=>{
        this.mergeAction(publishConf);
      }}
      onPublish={()=>{
        this.publishAction(publishConf);
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
                      closeText: "Cancel",
                      publishConf: publishConf
                    }
                  })
                }
              }
            >
              Edit Configuration
            </MenuItem>

            <MenuItem key="delete"
              onClick={
                ()=>{
                  this.setState({
                    menuOpen:null,
                    deleteDialogOpen: true,
                    keyForDeletion: publishConf.key
                  })
                }
              }>
              Delete Configuration
            </MenuItem>
          </Menu>
        </div>
      }

    />
  }

  render(){
    const { site, serverDialog } = this.state;
    let content = null;

    if(site.publish.length < 1){
      content = (
        <Box component="div" style={{
          }} m={2}>

        <p>No sync server is configured. Add one first.</p>
          <Button onClick={()=>{
            this.history.push(`${this.basePath}/add/x${Math.random()}`)
          }} color="primary" variant="contained">add sync server</Button>
        </Box>
      )
    }
    else if(site.publish.length === 1){
      content = this.renderMainCard(site.publish[0])
    }
    else if(this.props.syncConfKey){
      const publConf = site.publish.find( ({ key }) => key === this.props.syncConfKey );
      if(publConf){
        content = this.renderMainCard(publConf);
      }
    }
    else if(this.state.lastOpenedPublishedKey){
      const publConf = site.publish.find( ({ key }) => key === this.state.lastOpenedPublishedKey );
      if(publConf){
        content = this.renderMainCard(publConf);
      }
    }

    if(!content){
      content = this.renderMainCard(site.publish[0])
    }

    return (
      <Route render={({history})=>{

        this.history = history;
        return (

          <React.Fragment>

            <SnackbarManager />

            <div className={ this.props.classes.container }>

              {content}

            </div>

            <SyncBusyDialog
              {...this.state.serverBusyDialog}
              onClose={()=>{
                this.setState({serverBusyDialog: {
                  open:false
                }})
              }}
            />

            <SyncServerDialog
              {...serverDialog}
              site={this.state.site}
              onSave={(publishKey)=>{

                //this.savePublishData(publishKey, publishConfig);

                this.history.push(`${this.basePath}/list/${publishKey}`)

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

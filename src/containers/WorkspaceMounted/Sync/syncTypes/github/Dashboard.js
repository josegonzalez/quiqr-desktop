import * as React              from 'react';
import { withStyles }          from '@material-ui/core/styles';
import Box                     from '@material-ui/core/Box';
import Divider                 from '@material-ui/core/Divider';
import Paper                   from '@material-ui/core/Paper';
import Button                  from '@material-ui/core/Button';
import ArrowUpwardIcon         from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon       from '@material-ui/icons/ArrowDownward';
import Typography              from '@material-ui/core/Typography';
import Timeline                from '@material-ui/lab/Timeline';
import TimelineItem            from '@material-ui/lab/TimelineItem';
import TimelineSeparator       from '@material-ui/lab/TimelineSeparator';
import TimelineConnector       from '@material-ui/lab/TimelineConnector';
import TimelineContent         from '@material-ui/lab/TimelineContent';
import TimelineOppositeContent from '@material-ui/lab/TimelineOppositeContent';
import TimelineDot             from '@material-ui/lab/TimelineDot';
import NewReleasesIcon         from '@material-ui/icons/NewReleases';
import GitHubIcon from '@material-ui/icons/GitHub';
//import CloudIcon               from '@material-ui/icons/Cloud';
import CloudUploadIcon         from '@material-ui/icons/CloudUpload';
//import CloudDownloadIcon       from '@material-ui/icons/CloudDownload';
import SaveAltIcon             from '@material-ui/icons/SaveAlt';
import RefreshIcon             from '@material-ui/icons/Refresh';
import Link from '@material-ui/core/Link';
import SettingsIcon from '@material-ui/icons/Settings';
import Meta                    from './Meta'
import {snackMessageService}   from '../../../../../services/ui-service';
import service                 from '../../../../../services/service';

const useStyles = theme => ({
});

class Dashboard extends React.Component{

  moreAmount = 4;

  constructor(props){
    super(props);
    this.state = {
      historyArr: [],
      lastRefresh: '',
      resultsShowing: 0,
    };
  }

  componentDidMount(){
    this.softRefreshRemoteStatus();
  }

  softRefreshRemoteStatus(){

    this.props.onSyncDialogControl(
      true,
      'Read cached commit history',
      Meta.icon()
    );

    service.api.publisherDispatchAction(this.props.siteKey, this.props.publishConf, 'readRemote',{},90000).then((results)=>{
      this.setState({
        historyArr: results.commitList,
        lastRefresh: results.lastRefresh.toString(),
        resultsShowing: this.moreAmount
      });
      this.props.onSyncDialogControl(
        false,
        Meta.syncingText,
        Meta.icon()
      );
    }).catch(()=>{

      snackMessageService.addSnackMessage('Sync: read cached remote status failed.', {severity: 'warning'});

      this.props.onSyncDialogControl(
        false,
        Meta.syncingText,
        Meta.icon()
      );

    });
  }

  refreshRemoteStatus(){
    this.props.onSyncDialogControl(
      true,
      'Refreshing commit history',
      Meta.icon()
    );

    service.api.publisherDispatchAction(this.props.siteKey, this.props.publishConf, 'refreshRemote',{},90000).then((results)=>{
      this.setState({
        historyArr: results.commitList,
        lastRefresh: results.lastRefresh.toString(),
        resultsShowing: this.moreAmount
      });
      this.props.onSyncDialogControl(
        false,
        Meta.syncingText,
        Meta.icon()
      );

      snackMessageService.addSnackMessage('Sync: Refreshing remote status finished.', {severity: 'success'});
    }).catch(()=>{

      snackMessageService.addSnackMessage('Sync: Refreshing remote status failed.', {severity: 'warning'});

      this.props.onSyncDialogControl(
        false,
        Meta.syncingText,
        Meta.icon()
      );

    });
  }

  showMore(){
    this.setState({
      resultsShowing: (this.state.resultsShowing + this.moreAmount)
    });
  }

  pullFromRemote(){
    this.props.onSyncDialogControl(
      true,
      Meta.syncingText, Meta.icon());

    service.api.publisherDispatchAction(this.props.siteKey, this.props.publishConf, 'pullFromRemote',{},90000).then(()=>{

      this.props.onSyncDialogControl(
        false,
        Meta.syncingText, Meta.icon());

      snackMessageService.addSnackMessage('Sync: pull from remote finished.','success');

    }).catch((e)=>{
      snackMessageService.addSnackMessage('Sync: pull from remote failed.', {severity: 'warning'});
      this.props.onSyncDialogControl(
        false,
        Meta.syncingText, Meta.icon());
    });
  }

  pushToRemote(){
    this.props.onSyncDialogControl(
      true,
      Meta.syncingText, Meta.icon());

    service.api.buildWorkspace(this.props.siteKey, this.props.workspaceKey, null, this.props.publishConf).then(()=>{

      service.api.publisherDispatchAction(this.props.siteKey, this.props.publishConf, 'pushToRemote',{},90000).then(()=>{

        this.props.onSyncDialogControl(
          false,
          Meta.syncingText, Meta.icon());
        this.refreshRemoteStatus();

        snackMessageService.addSnackMessage('Sync: Push to remote finished.', {severity: 'success'});
      }).catch(()=>{
        this.props.onSyncDialogControl(
          false,
          Meta.syncingText, Meta.icon());
        snackMessageService.addSnackMessage('Sync: Push to remote failed.', {severity: 'warning'});
      });
    });
  }

  render(){
    let lastStatusCheck = this.state.lastRefresh;
    let unpushedChanges = false;
    let remoteDiffers = true;
    let historyArr = this.state.historyArr.slice(0,this.state.resultsShowing);

    return (
      <React.Fragment>

        <Box component="div" style={{
          display:'flex',
          alignItems: 'flex-start'
          }} m={2}>

          <Box component="span">
            <GitHubIcon fontSize="large"  style={{margin:'6px'}} />
          </Box>

          <Box component="span" style={{flexGrow:1}}>
            <Typography>{Meta.sidebarLabel(this.props.publishConf)}</Typography>

            <Link component="button" variant="body2"
              onClick={()=>{
                window.require('electron').shell.openExternal(Meta.repoAdminUrl(this.props.publishConf));
              }}
            >
            {Meta.repoAdminUrl(this.props.publishConf)}
            </Link>
          </Box>

          <Box component="span">
            <Button
              onClick={()=>{this.props.onConfigure()}}
              size="small"
              variant="contained"
              color="default"
              startIcon={<SettingsIcon />}
            >
              Configure
            </Button>
          </Box>
        </Box>

        <Box component="div" style={{
          display:'flex',
          alignItems: 'flex-start'
        }} m={2}>

          { this.props.enableSyncTo ?
            <Button
              onClick={()=>{this.pushToRemote()}}
              style={{marginRight:'5px'}}
              size="small"
              variant="contained"
              color="primary"
              startIcon={<ArrowUpwardIcon />}
            >
              Push to remote
            </Button>
            :null
          }

          { this.props.enableSyncFrom ?
            <Button
              onClick={()=>{this.pullFromRemote()}}
              size="small"
              variant="contained"
              color="primary"
              startIcon={<ArrowDownwardIcon />}
            >
              Pull from remote
            </Button>
            :null
          }
        </Box>

        <Divider/>


        <Box component="div"
          m={1}
          style={{
            display:'flex',
            justifyContent: 'flex-end',
          }}>
          <Box component="div" p={1}>
            <Typography variant="body2" color="textSecondary">
              Last history refresh: {lastStatusCheck}
            </Typography>
          </Box>

          <Button
            onClick={()=>{
              this.refreshRemoteStatus()
            }}
            size="small"
            variant="contained"
            color="default"
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>

        <Timeline xalign="alternate">

          {unpushedChanges ?
            <TimelineItem>
              <TimelineOppositeContent>
                <Paper elevation={3}>
                  <Box sx={{p:1}}>
                    <Typography variant="h6" component="h1">
                      There are unpublished local changes.
                    </Typography>

                    { this.props.enableSyncTo ?
                      <Box py={1}>

                        <Button
                          onClick={()=>{

                          }}
                          style={{marginRight:'5px'}}
                          size="small"
                          variant="contained"
                          color={remoteDiffers ? "secondary" : "primary"}
                          startIcon={<ArrowUpwardIcon />}
                        >
                          Push to Remote
                        </Button>

                        <Button
                          onClick={()=>{

                          }}
                          style={{marginRight:'5px'}}
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<SaveAltIcon />}
                        >
                          Local Commit
                        </Button>

                      </Box>:null}

                  </Box>
                </Paper>

              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot color="secondary">
                  <NewReleasesIcon />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
              </TimelineContent>
            </TimelineItem>
            :null}

          {historyArr.map((item, index)=>{

            let content = (
              <Paper elevation={3}>
                <Box p={2}>
                  <Typography variant="h6" component="h1">
                    {item.message.split("+")[0]}
                  </Typography>
                  <Typography>Author: {item.author}</Typography>
                  <Typography>Date: {item.date}</Typography>
                  <Typography>Ref: {item.ref.substr(0,7)}</Typography>
                  {/* this.props.enableSyncFrom ?
                    <Box py={1}>
                      {
                        item.local ? null :
                          <Button
                            onClick={()=>{

                            }}
                            style={{marginRight:'5px'}}
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<ArrowDownwardIcon />}
                          >
                            Try merge
                          </Button>

                      }
                      <Button
                        onClick={()=>{

                        }}
                        style={{marginRight:'5px'}}
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<ArrowDownwardIcon />}
                      >
                        Checkout this version
                      </Button>

                    </Box>
                    :null*/}
                </Box>
              </Paper>

            )

            return (
              <TimelineItem key={"timeline"+index}>
                <TimelineOppositeContent>
                  {item.local ? content : null}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot
                    color={item.local ? "primary" : "secondary"}
                  >
                    {/*item.local ? <LaptopMacIcon /> : <CloudIcon/>*/}
                    <CloudUploadIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  {item.local ? null : content}
                </TimelineContent>
              </TimelineItem>
            )
          })}


        </Timeline>
        { this.state.historyArr.length > this.state.resultsShowing ?
          <Box py={1} variant="div"
            style={{
              display:'flex',
              justifyContent: 'center',
            }}>

            <Button
              onClick={()=>{
                this.showMore();
              }}
              style={{marginRight:'5px'}}
              size="small"
              variant="contained"
              color="default"
              startIcon={<RefreshIcon />}
            >
              Load More
            </Button>

          </Box>:null}

      </React.Fragment>
    )
  }

}

export default withStyles(useStyles)(Dashboard);


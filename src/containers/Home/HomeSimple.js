import { Route } from 'react-router-dom';
import React from 'react';
import service from './../../services/service';
import { snackMessageService } from './../../services/ui-service';
import FlatButton from 'material-ui/FlatButton';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
//import IconNavigationCheck from 'material-ui/svg-icons/navigation/check';
//import IconAdd from 'material-ui/svg-icons/content/add';
//import IconFileFolder from 'material-ui/svg-icons/file/folder';
import IconAccountCircle from 'material-ui/svg-icons/action/account-circle';
import IconDomain from 'material-ui/svg-icons/social/domain';
import IconPublish from 'material-ui/svg-icons/editor/publish';

import TextField from 'material-ui/TextField';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { Wrapper, InfoLine, InfoBlock, MessageBlock } from './components/shared';
import { WorkspacesSimple } from './components/WorkspacesSimple';
import CreateSiteDialog from './components/CreateSiteDialog';
import PublishSiteDialog from './components/PublishSiteDialog';
import RegisterDialog from './components/RegisterDialog';
import BlockDialog from './components/BlockDialog';
import Spinner from './../../components/Spinner';
import MarkdownIt from 'markdown-it'

import type { EmptyConfigurations, Configurations, SiteConfig, WorkspaceHeader, WorkspaceConfig } from './../../types';

const md = new MarkdownIt({html:true});

const styles = {
    container:{
        display:'flex',
        height: '100%'
    },
    sitesCol: {
        flex: '0 0 280px',
        overflowY:'auto',
        overflowX:'hidden',
        userSelect:'none',
        borderRight: 'solid 1px #e0e0e0',
        background:'#fafafa'
    },
    selectedSiteCol: {
        flex: 'auto',
        overflow: 'auto'
    },
    siteActiveStyle: {
        fontWeight: 'bold',
        backgroundColor: 'white',
        borderBottom: 'solid 1px #e0e0e0',
        borderTop: 'solid 1px #e0e0e0',
        position: 'relative'
    },
    siteInactiveStyle: {
        borderBottom: 'solid 1px transparent',
        borderTop: 'solid 1px transparent'
    },
    creatorMessage: {
        borderBottom: 'solid 1px transparent',
        borderTop: 'solid 1px #ccc',
        padding: '0 20px ',
        fontSize: '80%'
    }
}

type HomeProps = {
    muiTheme : any,
    siteKey : string,
    workspaceKey : string
}

type HomeState = {
    configurations?: Configurations | EmptyConfigurations,
    selectedSite?: SiteConfig,
    selectedSiteWorkspaces?: Array<any>,
    selectedWorkspace?: WorkspaceHeader,
    selectedWorkspaceDetails?: WorkspaceConfig,
    createSiteDialog: bool,
    publishSiteDialog?: { workspace: WorkspaceConfig, workspaceHeader: WorkspaceHeader, open: bool },
    registerDialog?: { open: bool },
    blockingOperation: ?string //this should be moved to a UI service
}

class Home extends React.Component<HomeProps, HomeState>{

    history: any;

    constructor(props){
        super(props);
        this.state = {
            blockingOperation: null,
            currentSiteKey: null,
            createSiteDialog: false,
            publishSiteDialog: undefined,
            registerDialog: {open: false},
            siteCreatorMessage: null
        };
    }

    componentDidUpdate(preProps: HomeProps){
        if(this._ismounted && preProps.siteKey !== this.props.siteKey){
            this.checkSiteInProps();
        }
    }

    componentWillMount(){
        service.registerListener(this);
    }

    componentDidMount(){
        this.checkSiteInProps();
        this._ismounted = true;
    }

    checkSiteInProps(){
        var { siteKey, workspaceKey } = this.props;
        if(siteKey && workspaceKey){

            if(this.state.currentSiteKey != siteKey){
                // Serve the workspace at selection of the workspace right after mounting the workspace
                service.api.serveWorkspace(siteKey, workspaceKey, "instantly serve at selectWorkspace"/*serveKey*/);
            }

            this.setState({currentSiteKey: siteKey});
            this.setState({currentWorkspaceKey: workspaceKey});

            service.getSiteCreatorMessage(siteKey, workspaceKey).then((message)=>{
                let siteCreatorMessage = md.render(message);
                this.setState({siteCreatorMessage:siteCreatorMessage});
            });

            service.getSiteAndWorkspaceData(siteKey, workspaceKey).then((bundle)=>{
                var stateUpdate  = {};
                stateUpdate.configurations = bundle.configurations;
                stateUpdate.selectedSite = bundle.site;
                stateUpdate.selectedSiteWorkspaces = bundle.siteWorkspaces;
                stateUpdate.selectedWorkspace = bundle.workspace;
                stateUpdate.selectedWorkspaceDetails = bundle.workspaceDetails;
                this.setState(stateUpdate);
                return service.getWorkspaceDetails(siteKey, workspaceKey);
            })
        }
        else{
            service.getConfigurations(true).then((c)=>{
                var stateUpdate  = {};
                stateUpdate.configurations = c;
                this.setState(stateUpdate);
            })
        }
    }

    getWorkspaceDetails = (workspace: WorkspaceHeader)=> {
        if(this.state.selectedSite==null) throw new Error('Invalid operation.');
        return service.getWorkspaceDetails(this.state.selectedSite.key, workspace.key);
    }

    componentWillUnmount(){
        service.unregisterListener(this);
    }

    handleRegisterNow(){
        this.setState({registerDialog: { open: true}});
        service.api.logToConsole('registerNow');
    }

    handleRegisterCancelClick(){
        this.setState({registerDialog: {...this.state.registerDialog, open:false}});
    }

    handleRegisterClick(username, email){
        this.setState({registerDialog: {...this.state.registerDialog, open:false}});
        service.api.logToConsole(username);
        service.api.logToConsole(email);
    }

    renderSelectedSiteContent(configurations: Configurations, site: SiteConfig ){

        return (
            <Wrapper style={{maxWidth:'1000px'}} key={site.key} title="">

                <InfoLine label="Site name">
                    <h2 style={{padding:0, margin:0}}>{site.name}</h2>
                </InfoLine>

                <div style={{padding: "0px 16px"}}>
                    <List>
                        <ListItem leftIcon={<IconAccountCircle color="" style={{}} />} disabled={true} >
                            <span style={{fontWeight: "bold", fontSize:"110%"}}>You are using Poppygo anonymously</span> &nbsp;&nbsp;<a href="#" onClick={()=>{this.handleRegisterNow()}}>register now!</a>
                        </ListItem>

                        <ListItem leftIcon={<IconDomain color="" style={{}} />} disabled={true} >
                            <span style={{fontWeight: "bold", fontSize:"110%"}}>You haven’t linked your site {site.name} to a poppygo Domain</span> &nbsp;&nbsp;<a href="#" onClick={()=>{this.handleRegisterNow()}}>cleam domain!</a>
                        </ListItem>

                        <ListItem leftIcon={<IconPublish color="" style={{}} />} disabled={true} >
                            <span style={{fontWeight: "bold", fontSize:"110%"}}>Your site {site.name} is not yet published</span> &nbsp;&nbsp;<a href="#" onClick={()=>{this.handleRegisterNow()}}>publish now!</a>
                        </ListItem>
                     </List>
                </div>

                { this.renderWorkspaces(site, site.key===this.state.currentSiteKey, this.state.selectedSiteWorkspaces) }

                <div className="markdown"
                style={ styles.creatorMessage }
                dangerouslySetInnerHTML={{__html:this.state.siteCreatorMessage}}></div>

            </Wrapper>
        );
    }

    handleSelectWorkspaceClick = (e, siteKey, workspace)=> {
        e.stopPropagation();
        this.selectWorkspace(siteKey, workspace);
    };

    async selectWorkspace(siteKey: string, workspace : WorkspaceHeader ){


        this.setState({currentWorkspaceKey: workspace.key});
        let        select = true;
        if(select){
            await service.api.mountWorkspace(siteKey, workspace.key);
            this.history.push(`/sites/${decodeURIComponent(siteKey)}/workspaces/${decodeURIComponent(workspace.key)}`);
        }
        else{
            this.history.push(`/`);
        }
    }

    renderWorkspaces(site: SiteConfig, selectedSiteActive : bool , workspaces : ?Array<WorkspaceHeader>){

        return (
            <Route render={({history})=>{

                this.history = history; //ugly

                if(this.state.currentWorkspaceKey==null)
                    return (<Wrapper></Wrapper>);

                return (
                    <WorkspacesSimple
                        getWorkspaceDetails={this.getWorkspaceDetails}
                        workspaces={workspaces}
                        activeSiteKey={this.state.currentSiteKey}
                        activeWorkspaceKey={this.state.currentWorkspaceKey}
                        onLocationClick={(location)=>{
                            service.api.openFileExplorer(location)
                        }}
                        onPublishClick={(workspaceHeader, workspace)=>{
                            service.api.parentTempHideMobilePreview();
                            this.setState({publishSiteDialog: {workspace, workspaceHeader, open: true}});
                        }}
                        onStartServerClick={ (workspace, serveKey)=> { service.api.serveWorkspace(site.key, workspace.key, serveKey) } }
                        onSelectWorkspaceClick={ this.handleSelectWorkspaceClick }
                        site={site}
                    />
                )
            }} />
        );
    }

    handleAddSiteClick(){
        this.setState({createSiteDialog: true});
    }

    handleCreateSiteSubmit = (data)=>{
        this.setState({createSiteDialog:false, blockingOperation:'Creating site...'})

        service.api.createSite(data).then(()=>{
            return service.getConfigurations(true);
        }).then(configurations=>{
            this.setState({configurations});
        }).catch((e)=>{
            alert('Failed to create site');
        }).then(()=>{
            this.setState({ blockingOperation:null})
        });
    }

    handlePublishSiteCancelClick = () => {
        service.api.parentTempUnHideMobilePreview();
        this.setState({publishSiteDialog: {...this.state.publishSiteDialog, open:false}});
    }

    handleBuildAndPublishClick = ({siteKey, workspaceKey, build, publish}) => {
        service.api.parentTempUnHideMobilePreview();
        this.setState({blockingOperation: 'Building site...', publishSiteDialog: undefined});
        service.api.buildWorkspace(siteKey, workspaceKey, build).then(()=>{
            this.setState({blockingOperation: 'Publishing site...'});
            return service.api.publishSite(siteKey, publish);
        }).then(()=>{
            snackMessageService.addSnackMessage('Site successfully published.');
        }).catch(()=>{
            snackMessageService.addSnackMessage('Publish failed.');
        }).then(()=>{
            this.setState({blockingOperation: null});
        })
    }

    render(){

        let { siteKey } = this.props;
        let { selectedSite, configurations, createSiteDialog, publishSiteDialog, registerDialog } = this.state;

        let _configurations = ((configurations: any): Configurations);

        if(configurations==null){
            return <Spinner />
        }

        return (
            <div style={ styles.container }>
                <div style={styles.selectedSiteCol}>
                    { selectedSite==null ? (
                        <Wrapper title="Site Management">
                            <MessageBlock>Please, select a site.</MessageBlock>
                        </Wrapper>
                    ) : (
                        this.renderSelectedSiteContent(_configurations, selectedSite)
                    ) }
                </div>
                <CreateSiteDialog
                    open={createSiteDialog}
                    onCancelClick={()=>this.setState({createSiteDialog:false})}
                    onSubmitClick={this.handleCreateSiteSubmit}
                />
                { selectedSite!=null && this.state.publishSiteDialog!=null ? (
                    <PublishSiteDialog
                        site={selectedSite}
                        workspace={this.state.publishSiteDialog.workspace}
                        workspaceHeader={this.state.publishSiteDialog.workspaceHeader}
                        onCancelClick={this.handlePublishSiteCancelClick}
                        onBuildAndPublishClick={this.handleBuildAndPublishClick}
                        open={publishSiteDialog!=null&&publishSiteDialog.open}
                    />
                ):(null) }

                { selectedSite!=null && this.state.registerDialog!=null ? (
                    <RegisterDialog
                        onCancelClick={()=>this.handleRegisterCancelClick()}
                        onRegisterClick={({username, email})=>{
                          this.handleRegisterClick(username, email)
                        }}

                        open={registerDialog!=null&&registerDialog.open}
                    />
                ):(null) }


                {/*this should be moved to a UI service*/}
                <BlockDialog open={this.state.blockingOperation!=null}>{this.state.blockingOperation}<span> </span></BlockDialog>
            </div>
        );
    }

}

export default muiThemeable()(Home);

//@flow

//import invariant from 'assert';
import { Route } from 'react-router-dom';
import React from 'react';
import service from './../../services/service';
import { snackMessageService } from './../../services/ui-service';
import FlatButton from 'material-ui/FlatButton';
//import RaisedButton from 'material-ui/RaisedButton';
//import Paper from 'material-ui/Paper';
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import IconNavigationCheck from 'material-ui/svg-icons/navigation/check';
import IconAdd from 'material-ui/svg-icons/content/add';
import IconFileFolder from 'material-ui/svg-icons/file/folder';
//import {Accordion,AccordionItem} from './../../components/Accordion';
//import DangerButton from './../../components/DangerButton';
import TextField from 'material-ui/TextField';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { Wrapper, InfoLine, InfoBlock, MessageBlock } from './components/shared';
import { WorkspacesSimple } from './components/WorkspacesSimple';
import CreateSiteDialog from './components/CreateSiteDialog';
import PublishSiteDialog from './components/PublishSiteDialog';
import BlockDialog from './components/BlockDialog';
import Spinner from './../../components/Spinner';

import type { EmptyConfigurations, Configurations, SiteConfig, WorkspaceHeader, WorkspaceConfig } from './../../types';

//$FlowFixMe
//const Fragment = React.Fragment;

const styles = {
    container:{
        display:'flex',
        height: '100%'
    },
    sitesCol: {
        flex: '0 0 100%',
        overflowY:'auto',
        overflowX:'hidden',
        userSelect:'none',
        //borderRight: 'solid 1px #e0e0e0',
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
    blockingOperation: ?string //this should be moved to a UI service
}

class SelectSite extends React.Component<HomeProps, HomeState>{

    history: any;

    constructor(props){
        super(props);
        this.state = {
            blockingOperation: null,
            createSiteDialog: false,
            publishSiteDialog: undefined
        };
    }

    componentDidUpdate(preProps: HomeProps){
    }

    componentWillMount(){
        service.registerListener(this);
    }

    componentDidMount(){
        console.log('HOME MOUNTED');

        var { siteKey, workspaceKey } = this.props;
        if(siteKey && workspaceKey){
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
            service.getConfigurations().then((c)=>{
                var stateUpdate  = {};
                stateUpdate.configurations = c;
                this.setState(stateUpdate);
            })
        }
    }

    selectSite(site : SiteConfig ){
        //this.setState({selectedSite: site, selectedSiteWorkspaces:[]});
        //load all site configuration to enforce validation
        service.api.listWorkspaces(site.key).then((workspaces)=>{

            if(workspaces.length === 1){
                //this.selectWorkspace(site.key, workspaces[0]);
                service.api.parentMountWorkspace(site.key, workspaces[0].key);
            }

            //this.setState({selectedSiteWorkspaces: workspaces});
            window.close();
        });
    }

    getWorkspaceDetails = (workspace: WorkspaceHeader)=> {
        if(this.state.selectedSite==null) throw new Error('Invalid operation.');
        return service.getWorkspaceDetails(this.state.selectedSite.key, workspace.key);
    }

    componentWillUnmount(){
        service.unregisterListener(this);
    }

    handleSelectWorkspaceClick = (e, siteKey, workspace)=> {
        e.stopPropagation();
        this.selectWorkspace(siteKey, workspace);
    };

    async selectWorkspace(siteKey: string, workspace : WorkspaceHeader ){
        let activeWorkspaceKey = this.props.workspaceKey;
        let activeSiteKey = this.props.siteKey;

        let select = (
            activeWorkspaceKey==null ||
            activeSiteKey==null ||
            //activeWorkspaceKey!=workspace.key ||
            activeWorkspaceKey!==workspace.key ||
            //activeSiteKey!=siteKey
            activeSiteKey!==siteKey
        );

        if(select){
            await service.api.mountWorkspace(siteKey, workspace.key);
            await service.api.serveWorkspace(siteKey, workspace.key, "instantly serve at selectWorkspace"/*serveKey*/);
        }
        else{
            //this.history.push(`/`);
        }
        console.log(window.location.toString());
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
        this.setState({publishSiteDialog: {...this.state.publishSiteDialog, open:false}});
    }

    handleBuildAndPublishClick = ({siteKey, workspaceKey, build, publish}) => {
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
        //let { selectedSite, selectedWorkspace, configurations, createSiteDialog, publishSiteDialog } = this.state;
        let { selectedSite, configurations, createSiteDialog, publishSiteDialog } = this.state;

        let _configurations = ((configurations: any): Configurations);

        if(configurations==null){
            return <Spinner />
        }

        return (
            <div style={ styles.container }>
                <div style={ styles.sitesCol }>
                    <List>
                        <Subheader>All Sites</Subheader>
                        { (_configurations.sites||[]).map((item, index)=>{
                            let selected = item===selectedSite;
                            let active = selectedSite && siteKey===item.key;
                            return (<ListItem
                                key={index}
                                style={selected? styles.siteActiveStyle : styles.siteInactiveStyle }
                                rightIcon={<IconNavigationCheck color={active?this.props.muiTheme.palette.primary1Color:undefined}  />}
                                onClick={ ()=>{ this.selectSite(item); } }
                                primaryText={ item.name }
                            />);
                        })}
                        { configurations.empty || _configurations.global.siteManagementEnabled ? (
                            <ListItem
                                key="add-site"
                                style={ styles.siteInactiveStyle }
                                rightIcon={<IconAdd />}
                                onClick={ this.handleAddSiteClick.bind(this) }
                                primaryText="New"
                            />
                        ) : ( null ) }
                    </List>
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

                {/*this should be moved to a UI service*/}
                <BlockDialog open={this.state.blockingOperation!=null}>{this.state.blockingOperation}<span> </span></BlockDialog>
            </div>
        );
    }

}

export default muiThemeable()(SelectSite);
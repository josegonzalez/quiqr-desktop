import * as React from 'react';
import { Dialog, FlatButton } from 'material-ui';
import type { SiteConfig, WorkspaceHeader, WorkspaceConfig } from './../../../types';
//import { Accordion, AccordionItem } from './../../../components/Accordion';
//import IconNavigationCheck from 'material-ui/svg-icons/navigation/check';

type PublishSiteDialogProps = {
    site: SiteConfig,
    workspace: WorkspaceConfig,
    workspaceHeader: WorkspaceHeader,
    open: bool,
    onCancelClick: ()=>void,
    onBuildAndPublishClick: ({siteKey: string, workspaceKey:string, build:string, publish:string})=>void
}

type PublishSiteDialogState = {
    build: string,
    publish: string
}

export default class PublishSiteDialog extends React.Component<PublishSiteDialogProps,PublishSiteDialogState>{

    constructor(props: PublishSiteDialogProps){
        super(props);
        this.state = {
            build: '',
            publish: ''
        }
    }


    handleCancelClick = () => {
        this.props.onCancelClick();
    }

    handleBuildAndPublishClick = () => {
        this.props.onBuildAndPublishClick({
            siteKey:this.props.site.key,
            workspaceKey: this.props.workspaceHeader.key,
            build: this.state.build,
            publish: this.state.publish
        });
    }

    handlePublishChange = (e: any, index: number) => {
        this.setState({publish: this.props.site.publish[index].key});
    }

    handleBuildChange = (e: any, index: number) => {
        this.setState({build: this.props.workspace.build[index].key});
    }

    validate(){
        return this.state.build!==''&&this.state.publish!=='';
    }

    /*
    renderFieldsRemoveMe(){
        let { open, workspace, site } = this.props;
        let { build, publish } = this.state;
        return (
            <div>
            <TextField floatingLabelText={'Site'} readOnly fullWidth value={this.props.site.key} />

                <SelectField
                    onChange={this.handleBuildChange}
                    fullWidth
                    value={workspace.build.findIndex(x => x.key===build)}
                    floatingLabelText="Build Config *">
                    {this.props.workspace.build.map((build, i)=>(
                        <MenuItem
                            key={`build-${i}`} value={i}
                            primaryText={build.key}
                          secondaryText={build.config}
                        />
                    ))}
                </SelectField>
                <SelectField
                    onChange={this.handlePublishChange}
                    fullWidth
                    value={site.publish.findIndex(x => x.key===publish)}
                    floatingLabelText="Publish Config *">
                    {this.props.site.publish.map((publish, i)=>(
                        <MenuItem
                            key={`publish-${i}`} value={i}
                            primaryText={publish.key||'default'}
                            secondaryText={publish.config.type}
                        />
                    ))}
                    </SelectField>
                </div>
        )

    }
    */

    render(){

        let { open, workspace, site } = this.props;
        let { build, publish } = this.state;

        if(build==="" && workspace.build.length > 0){
            this.setState({build: this.props.workspace.build[0].key});
        }

        if(publish==="" && site.publish.length > 0){
            this.setState({publish: this.props.site.publish[0].key});
        }

        let valid = this.validate();

        const actions = [
            <FlatButton
                label="Cancel"
                primary={false}
                onClick={this.handleCancelClick.bind(this)}
            />,
            <FlatButton
                disabled={!valid}
                label="Build and Publish"
                primary={true}
                onClick={this.handleBuildAndPublishClick}
            />,
        ];

        let active=true;

        return (
            <Dialog
            title={"Publish Site.. "+this.props.site.key}
            open={open}
            actions={actions}>
            <div>
                Publish changes to the PoppyGo Webservers.
            </div>
        </Dialog>
        );
    }

}

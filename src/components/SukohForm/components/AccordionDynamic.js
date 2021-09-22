import React                        from 'react';
import { List, ListItem }           from 'material-ui-02/List';
import RaisedButton                 from 'material-ui-02/RaisedButton';
import IconAdd                      from 'material-ui-02/svg-icons/content/add';
import IconRemove                   from 'material-ui-02/svg-icons/content/clear';
import IconSort                     from 'material-ui-02/svg-icons/editor/drag-handle';
import IconChevronRight             from 'material-ui-02/svg-icons/navigation/chevron-right';
import IconFileFolder               from 'material-ui-02/svg-icons/file/folder';
import { FlatButton }               from 'material-ui-02';
import { Accordion, AccordionItem } from '../../Accordion'
import DangerButton                 from '../../DangerButton';
import dynamicComponentUtils        from './shared/dynamic-component-utils'
import service                      from '../../../services/service';

import type { DynamicFormNode, ComponentProps, FieldBase } from '../../HoForm';

import { BaseDynamic, FieldsExtender, FormStateBuilder } from '../../HoForm';

const Fragment = React.Fragment;

type AccordionDynamicField = {
  title:string,
  fields:Array<any>
} & FieldBase;

type AccordionDynamicState = {
  index: ?number,
  dragFromIndex: ?number,
  dragToIndex: ?number
}

class AccordionDynamic extends BaseDynamic<AccordionDynamicField, AccordionDynamicState> {

  documentMouseUpListener: ()=>void;

  constructor(props: ComponentProps<AccordionDynamicField>){
    super(props);

    this.state = {
      index: null,
      dragFromIndex: null,
      dragToIndex: null,
      dynFields: {},
      dynFieldsEmpty: []
    };
  }

  extendField(field: AccordionDynamicField, fieldExtender: FieldsExtender){
    fieldExtender.extendFields(field.fields);
  }

  getType(){
    return 'accordion';
  }

  normalizeState({state, field, stateBuilder} : { state: any, field: AccordionDynamicField, stateBuilder: FormStateBuilder }){
    dynamicComponentUtils.normalizeStateForArrayOfObject(state, field, stateBuilder);
  }

  buildBreadcumbFragment(currentNode: DynamicFormNode<AccordionDynamicField>, items: Array<{label: string, node:?DynamicFormNode<FieldBase>}>): void{
    if(items.length>0){ //has a previous item
      var previousItem = items[items.length-1];
      if(previousItem.node==null||previousItem.node.uiState==null){
        throw new Error('Unexpected state');
      }
      items.push({label: '' + previousItem.node.uiState.childIndex, node: null});
    }
    items.push({label: currentNode.field.title, node:(currentNode/*: any*/)});
  }

  buildPathFragment(node: any, nodeLevel: any, nodes: any){
    if(nodeLevel > 0)
      return node.field.key + '/' + nodes[nodeLevel-1].uiState.childIndex;
    return node.field.key;
  }

  onAddClickHandler(){
    let context = this.props.context;
    let copy = context.value.slice(0);
    let newData = {};
    context.setLevelState(newData, context.node.field.fields);
    copy.push(newData);
    context.setValue(copy);
  };

  removeItemAtIndex(i: number){
    let context = this.props.context;
    let copy = context.value.slice(0);
    copy.splice(i, 1);
    context.setValue(copy);
  }

  swapItems({index, otherIndex}: {index: number, otherIndex: number}){
    if(index===otherIndex)
      return;
    let context = this.props.context;
    let copy = context.value.slice(0);
    let temp = copy[index];
    copy[index] = copy[otherIndex];
    copy[otherIndex] = temp;
    context.setValue(copy);
  }

  //DRAG EVENTS
  getDocumentMouseUpListener(){
    this.documentMouseUpListener = function(e: any){
      if(this.state.dragFromIndex!=null&&this.state.dragToIndex!=null){
        this.swapItems({index:this.state.dragFromIndex, otherIndex:this.state.dragToIndex});
        this.setState({ dragFromIndex: null, dragToIndex:null });
      }
      document.removeEventListener('mouseup', this.documentMouseUpListener);
    }.bind(this)
    return this.documentMouseUpListener;
  }

  getOnItemDragHandleMouseDown(index: number){
    return function(e: any){
      if(true /*this.props.sortable*/){
        this.setState({ dragFromIndex: index, dragToIndex: index, index:-1 });
        document.addEventListener('mouseup', this.getDocumentMouseUpListener());
      }
    }.bind(this)
  }

  getOnItemMouseEnter(index: number){
    return function(e: any){
      if(this.state.dragFromIndex!=null){
        this.setState({dragToIndex: index});
      }
    }.bind(this)
  }

  componentDidMount(){
    this.procDynamicFields();
  }

  procDynamicFields(){

    let {context} = this.props;
    let {node, currentPath} = context;
    let {field} = node;

    let dynFields = {}
    let dynFieldsEmpty = field.fields;


    if(!Array.isArray(context.value)){
      context.value = [];
    }
    context.value.map( async (item: any, childIndex: number)=>{
      let componentKey = `item-${childIndex}`;

      if("dynFormSearchKey" in field){
        let dynFormObjectFile = "sukoh"; //search in sukoh by default
        let dynFormObjectRoot = "partials"; //search in sukoh by default

        if("dynFormObjectRoot" in field){
          dynFormObjectRoot = field.dynFormObjectRoot;
        }
        if("dynFormObjectFile" in field){
          dynFormObjectFile = field.dynFormObjectFile;
        }

        let searchKey = field["dynFormSearchKey"];
        let searchVal = item[searchKey];
        let dynSearchKeyVal = { key: searchKey, val: searchVal }

        await service.api.getDynFormFields( dynFormObjectFile, dynFormObjectRoot, dynSearchKeyVal).then(function(extraFields){
          if (typeof extraFields !== 'undefined') {

            extraFields.fields.forEach(function(extrField){
              extrField.compositeKey = field.compositeKey + "." + extrField.key;
              extrField.lazy = true;
              //service.api.logToConsole(extrField,"lazefield");
              //TODO make recursive
              if("fields" in extrField){
                extrField.fields.forEach(function(efld2nd){
                  efld2nd.compositeKey = extrField.compositeKey + "." + efld2nd.key;
                });
              }
            });

            let cleanedFieldFields = field.fields.filter(function( obj ) {
              let found = extraFields.fields.find((x)=>x.key===obj.key);
              if (typeof found === 'undefined') {
                return true;
              }
            });


            dynFields[componentKey] = cleanedFieldFields.concat(extraFields.fields);
          }
        });
      }

    });
    this.setState({dynFields: dynFields, dynFieldsEmpty: dynFieldsEmpty});
  }

  renderComponent(){

    let {context} = this.props;
    let {node, currentPath} = context;
    let {field} = node;

    if(!Array.isArray(context.value)){
      context.value = [];
    }

    if(currentPath===context.parentPath){

      return (<List style={{marginBottom:16, padding: 0}}><ListItem
      style={{ border: 'solid 1px #d8d8d8', borderRadius:'7px'}}
      onClick={ function(){ context.setPath(node) } }
      leftIcon={<IconFileFolder />}
      rightIcon={<IconChevronRight />}
      primaryText={field.title}
      secondaryText={context.value.length +' items'}
    /></List>
      );
    }

    if(currentPath===context.nodePath){
      let { dragToIndex, dragFromIndex } = this.state;

      let renderItem = (componentKey: string, item: any, childIndex: number, isDragging: bool = false)=>{

        if(this.state.dynFieldsEmpty.length > 0){
          if(componentKey in this.state.dynFields){
            field.fields = this.state.dynFields[componentKey];
          }
          else{
            field.fields = this.state.dynFieldsEmpty;
          }
        }

        let label = 'Untitled';

        let newNode = {
          field,
          state: context.value[childIndex],
          uiState:{childIndex},
          parent: node
        };

        let arrayTitle = field.fields.find((x)=>x.arrayTitle===true);
        if(arrayTitle && newNode.state[arrayTitle.key]){
          label = newNode.state[arrayTitle.key];
        }

        let headStyle = {
          backgroundColor: '#eee',
        }
        if(isDragging){
          headStyle = {
            backgroundColor: "#e2e2e2",
          };
        }

        return (
          <AccordionItem key={componentKey}
          label={label}
          headStyle={headStyle}
          bodyStyle={{padding:'16px 16px 0px 16px'}}
          body={ context.renderLevel(newNode) }
          wrapperProps={{
            onMouseEnter: this.getOnItemMouseEnter(childIndex)
          }}
          headerRightItems={[
            <FlatButton
            onClick={(e)=>{e.stopPropagation()}}
            onMouseDown={this.getOnItemDragHandleMouseDown(childIndex)}
            style={{minWidth:40, cursor: 'move'}} icon={<IconSort opacity={.3} />} />,
            <DangerButton
            onClick={(e, loaded)=>{
              e.stopPropagation();
              if(loaded){
                this.removeItemAtIndex(childIndex)
              }
            }}
            loadedButton={<FlatButton secondary={true} style={{minWidth:40}} icon={<IconRemove />} />}
            button={<FlatButton style={{minWidth:40}} icon={<IconRemove opacity={.3} />} />}
          />
          ]}
          />
        );
      };

      return (<Fragment>
        <Accordion index={this.state.index} onChange={(index)=>{
          this.setState({index:this.state.index===index?-1:index});
        }}>
        {context.value.map((item: any, childIndex: number)=>{

          let componentKey = `item-${childIndex}`;
          if(childIndex===dragFromIndex){
            return renderItem(componentKey, item, childIndex, true);
          }

          if(childIndex===dragToIndex&&dragFromIndex!=null&&dragToIndex!=null){
            let movedItem = <div style={{margin:'8px 0', height:'8px', background:'#00bcd4'/*cyan500*/, borderRadius:3}}></div>;
            let beforeItem, afterItem;
            if(dragFromIndex < dragToIndex)
              afterItem = movedItem;
            else
              beforeItem = movedItem;
            return <Fragment key={componentKey}>
              {beforeItem}
              {renderItem(componentKey, item,childIndex)}
              {afterItem}
            </Fragment>
          }
          else{
            return renderItem(componentKey, item, childIndex);
          }
        })}
          </Accordion>
          <RaisedButton
          style={{marginTop:'16px'}}
          onClick={this.onAddClickHandler.bind(this)}
          icon={<IconAdd />}
        />
            </Fragment>);
    }

    if(currentPath.startsWith(context.nodePath)){

      let matchedNode = context.findPreviousNodeInCurrentNodeTree(node);
      if(matchedNode==null||matchedNode.uiState==null||matchedNode.uiState.childIndex==null){
        throw new Error('Unexpected state.');
      }
      let childIndex = matchedNode.uiState.childIndex;
      return (context.renderLevel({
        field,
        state: context.value[childIndex],
        uiState: {childIndex},
        parent: node
      }));

    }

    return (null);
  }
}

export default AccordionDynamic;

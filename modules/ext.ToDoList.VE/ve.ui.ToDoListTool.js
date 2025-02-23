/**
 * Tool is used to insert a ToDoList template.
 *
 * @class
 * @extends ve.ui.ToDoListTemplateTool
 *
 * @constructor
 * @param {OO.ui.ToolGroup} toolGroup
 * @param {Object} [config] Configuration options
 */

ve.ui.ToDoListTemplateTool = function VeUiToDoListTemplateTool() {
    // Parent constructor
    ve.ui.ToDoListTemplateTool.super.apply(this, arguments);
};

/* Inheritance */
OO.inheritClass(ve.ui.ToDoListTemplateTool, ve.ui.MWTransclusionDialogTool);

//Create and register wikitext command
var checkboxElem = [{
    type: 'mwTransclusionInline',
    attributes: {
        mw: {
            parts: [
                '<todo/>'
            ]
        }
    }
}, {
    type: '/mwTransclusionInline'
}];
ve.ui.commandRegistry.register(
    new ve.ui.Command('addcheckbox', 'content', 'insert', {
        args: [checkboxElem, true, true],
        supportedSelections: ['linear']
    })
);
// VE source editor
if (ve.ui.wikitextCommandRegistry) {
    ve.ui.wikitextCommandRegistry.register(
        new ve.ui.Command('addcheckbox', 'mwWikitext', 'wrapSelection', {
            args: ['<todo/>'],
            supportedSelections: ['linear']
        })
    );
}

/* Static Properties */
ve.ui.ToDoListTemplateTool.static.name = 'todolist';
ve.ui.ToDoListTemplateTool.static.name = 'insert';
ve.ui.ToDoListTemplateTool.static.title = mw.msg('ve-todolist-toolbar-button');
ve.ui.ToDoListTemplateTool.static.icon = 'check';
ve.ui.ToDoListTemplateTool.static.commandName = 'addcheckbox';


/* Registration */

ve.ui.toolFactory.register(ve.ui.ToDoListTemplateTool);
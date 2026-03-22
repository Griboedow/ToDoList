<?php

use MediaWiki\Parser\Parser;

/**
 * Hooks used by ToDoList extension 
 */
class ToDoListHooks
{

	/**
	 * We extend parser here.
	 * Parser will process our custom tag: <todo>
	 */
	public static function onParserSetup(Parser $parser)
	{
		$parser->setHook('todo', 'ToDoListHooks::processToDoListTag');
		return true;
	}


	/**
	 * Implementation of the '<todo>' tag processing
	 */
	public static function processToDoListTag($input, array $args, Parser $parser, PPFrame $frame)
	{
		$out = $parser->getOutput();
		OutputPage::setupOOUI();
		$out->setEnableOOUI(true);
		$out->addModules(['ext.ToDoList']);

		$isDone = false;
		if (isset($args['done'])) {
			$isDone = filter_var($args['done'], FILTER_VALIDATE_BOOLEAN);
		}

		$checkboxControl = new OOUI\CheckboxInputWidget([
			'selected' => $isDone,
			'classes' => ['todo-checkbox']
		]);
		$checkboxHtml = $checkboxControl->toString();

		// Detect if this tag comes from a template transclusion.
		// Transcluded checkboxes cannot be toggled from the transcluding page
		// because the raw wikitext doesn't contain them.
		if ($frame->depth > 0) {
			$wrappedHtml = '<span data-todo-transcluded="true">' . $checkboxHtml . '</span>';
		} else {
			// Direct (non-transcluded) checkbox — assign a server-authoritative index.
			// Stored per-parse via ParserOutput::setExtensionData so it resets naturally.
			$counter = $out->getExtensionData('todolist-counter') ?? 0;
			$counter++;
			$out->setExtensionData('todolist-counter', $counter);
			$wrappedHtml = '<span data-todo-index="' . $counter . '">' . $checkboxHtml . '</span>';
		}

		return [$wrappedHtml, 'markerType' => 'nowiki'];
	}

	/**
	 * After all tags are processed, set the final direct checkbox count
	 * as a JS config variable (once, to avoid conflicting values).
	 */
	public static function onParserAfterTidy(Parser $parser, &$text)
	{
		$out = $parser->getOutput();
		$counter = $out->getExtensionData('todolist-counter');
		if ($counter !== null) {
			$out->setJsConfigVar('wgToDoDirectCount', $counter);
		}
		return true;
	}
}

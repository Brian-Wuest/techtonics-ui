# Form Controls

The following are the UI components which need to have form control capabilities:

- ╪ Number Spinner
- ╪ Date Time Picker
- ╪ Currency Input
- ╪ Input
- ╪ Dropdown
- ╪ List box
- ╪ Toggle

## Update Notes

- Need to go through each of the controls and make sure that any english text shown on the UI as placeholders or default text has an option as an input to be overridden, this way it is compatible with a multi-lingual application.
╪ - Currency Control
  ╪ - Add number spinner option
╪ - Input control
  ╪ - Add clear button option
╪ - Date/Time Picker
  ╪ - Add clear button option
  ╪ - When showing time, show a "close" button to close the dropdown.
  ╪ - Show a "today" button to jump to today's date.
    NOTE: Not doing just yet
╪ - Dropdown
  ╪ - Add clear button option
  ╪ - Expand to be more than just strings
  ╪ - Needed a dedicated type like we do for treeview, navbar, listbox, etc.
    ╪ - This way each item could be disabled, have an icon and have their own data item and key value and label.
╪ - Move everything away from `@Input` and `@Output` to `input` and `output` as this is the modern way.
╪ - Vertical Nav
  ╪ - Sub-items need some left padding, the text is too close to the left
╪ - Look at the implementation for ShiftSync to determine what other controls this project should implement.
  ╪ - Text Buttons With Icons!
    ╪ - We have text buttons, and icon buttons, but not the two together!!!
  ╪ - Input that has a button attached to the front which an have a dynamic popover component. See the one of the supervisor assignment screens for an example of what was needed for the implementation!
  ╪ - Input with a general icon prefix
    ╪ - This is for a "Search" input to make it more apparent what it's intentionality is.
  ╪ - Dropdown
    ╪ - Need ability to show a Checkbox
      ╪ - With "Select All" option!
    ╪ - Need to be able to specify an item template!
        ╪ - This item should not be selectable!
    ╪ - Need to be able to filter the results (when there are too many)
      ╪ - Take the fuzzy matching processing from the list or most likely, break that out into it's own service.
    ╪ - Dropdowns should be able to overflow modals when the panel is opened.
  ╪ - Number input
    ╪ - Need to be able to set the number of decimal points (min an max)
  ╪ - Stepper
    ╪ - Just make this solid color like prime does with whether or not it shows the primary color vs, gray (when disabled or un-selected).
  ╪ - Need a "Radio Group" type of form control where there are a number of visual options but the user can only choose from 1 of them.
  ╪ - Modals
    ╪ - Should be closable by the "Escape" button
    ╪ - Should have size definitions where the body can be scrollable.
  ╪ - Add a collapseable "Panel" component, basically like a card, but looks a bit different.
    ╪ - Uses a `<section>` under the hood.
  ╪ - Make sure all of our directives are prefixed with `ui-` to make sure they don't collide with any built-in directives.
    ╪ - Same with any parameters!
  ╪ - Add more options for tables, need to be able to sort, have table header stuff, pagination, look at worker client app for stuff.
╪ - Grab some useful directives and put them in this project
╪ - Get a grid system css in here, probably take from PrimeFlex or something.
╪ - Implement more of the form control inputs/outputs to ensure that consuming applications can utilize them. Never know when I might need something and I don't want to have to come back later and add it.
  - At a minimum, each control should be disableable!
  - Update the following controls:
    ╪ - UI-CheckBox
    ╪ - UI-Currency-Input
    ╪ - UI-Date-Time-Picker
    ╪ - UI-Dropdown
    ╪ - UI-Input
    ╪ - UI-ListBox
    ╪ - UI-Number-Spinner
    ╪ - UI-Radio-Button
    ╪ - UI-Toggle
  ╪ - Implement the following inputs (as applicable):
    ╪ - disabled
    ╪ - readonly
    ╪ - hidden
    ╪ - invalid
    ╪ - touched
    ╪ - dirty
    ╪ - name
    ╪ - required
    ╪ - min (if a number)
    ╪ - minLength (if a text type input)
    ╪ - max (if a number)
    ╪ - maxLength (if a text type input)
    ╪ - pattern
  ╪ - Implement the following ouotputs (as applicable):
    ╪ - touch (if not already done)
    ╪ - focus
    ╪ - reset
      ╪ - This one will be tricky as we will have to hold onto the original value.
╪ - Implement a loading spinner component.
  ╪ - Could pull this from Worker-Client as there is a good implementation there.
    ╪ - Ended up creating a brand new implementation.
    ╪ - This one has hooks for an HTTP Interceptor so can automatically know when all calls are complete so the engineer doesn't have to litter their code with show/hide function calls.
    ╪ - It's all managed in the interceptor.
    ╪ - There is also a way for it to work with gRPC but it's a bit more for the consumer to manage but I have documentation for it so that's okay.
╪ - Add option for paginator to determine the number of pages which can be shown (default to 10);
  ╪ - Next/previous buttons should be "ghost" buttons.
  ╪ - List options should be (by default): 10, 25, 50, 100
  ╪ - When there are many pages we should only show the current page plus two forward and 2 backward (so 5 total) pages. We don't want a whole mess of pages if there is actually a TON of data!
╪ - Remove english from ui controls or at least have input options to replace them.
╪ - Refactor listbox so it's not an `any` type and an actually structured type like we have for dropdowns. Maybe use the same type since we need basically all of the same stuff?
╪ - Add `Accordion` type control.
╪ - Add `Menu` type popover
  ╪ - This would include a `MenuType` model.
  ╪ - See how PrimeNG does this, they have a good one
╪ - Add a `Drawer` modal type
  ╪ - This would be for showing a modal that show up from the side of the screen (top, bottom, left, right)
╪ - Fix tooltip always showing when container is destroyed.
╪ - Add generic `Popover` component which can hold basically anything, kind of like a modal that is anchored to a particular host element.
╪ - Update the following components to use the `ui-icon` directive
  ╪ - Update vertical-nav to use `ui-icon` directive.
  ╪ - Update app-nav to show icon (and use `ui-icon` directive) when an icon has been set for the item.
  ╪ - Update menu (and sub-menu) to use `ui-icon` directive when the menu item is using an icon.
  ╪ - Update tab to use `ui-icon` directive when the tab item is using an icon.
╪ - Add a "Color Input" component
╪ - Add `Dark Mode` toggle component. Since we use dark mode a lot here, it makes sense to add a component specific for this purpose.

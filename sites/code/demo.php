<!DOCTYPE html>
<html lang="en">
<head>
<title>ACE in Action</title>
<style type="text/css" media="screen">
    #editor { 
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }
</style>
</head>
<body>

<div id="editor"></div>
<script src="https://code.phijs.earth/js/ace.js" type="text/javascript" charset="utf-8"></script>
<textarea id="code" style="display: none;">
    <script>
        alert('hello world!')
    </script>
</textarea>
<script>
    ace.require("ace/ext/language_tools");
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/cobalt");
    editor.session.setMode("ace/mode/ejs");
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: false
    });
    editor.session.setValue('');
    editor.session.setValue(document.getElementById('code').value);
</script>
</body>
</html>
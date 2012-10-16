function runTest()
{
    FBTest.sysout("issue959.START");
    FBTest.setPref("commandLineShowCompleterPopup", true);
    FBTest.openNewTab(basePath + "console/completion/959/issue959.html", function(win)
    {
        FBTest.openFirebug();
        FBTest.enableConsolePanel(function(win)
        {
            var panel = FW.Firebug.chrome.selectPanel("console");

            var doc = FW.Firebug.chrome.window.document;
            var cmdLine = doc.getElementById("fbCommandLine");
            var completionBox = doc.getElementById("fbCommandLineCompletion");
            var popup = doc.getElementById("fbCommandLineCompletionList");
            cmdLine.value = "";

            function testWithPopup(callback, expr, wanted, wantedPopup)
            {
                // To save on time, only send the last character as a key press.
                cmdLine.focus();
                cmdLine.value = expr.slice(0, -1);
                FBTest.synthesizeKey(expr.slice(-1), null, win);

                FBTest.compare(expr + wanted, completionBox.value,
                    "Completing \"" + expr + "|" + wanted + "\"");
                FBTest.compare(wantedPopup, (popup.state !== "closed"),
                    "Completion box should " + (wantedPopup ? "" : "not ") + " open.");

                callback();
            }

            function testHidden(callback, expr)
            {
                // Add one shown property - if the popup shows there must have been
                // another one before.
                // (N.B., in the case expr = "''.toLocaleU" the eval doesn't
                // work, but this is okay because the correct property is set
                // on String.prototype just before.)
                win.wrappedJSObject.eval(expr + "2 = 0");

                cmdLine.focus();
                cmdLine.value = expr.slice(0, -1);
                FBTest.synthesizeKey(expr.slice(-1), null, win);
                FBTest.compare("closed", popup.state, "Completion box should not open.");

                if (expr === "tos") {
                    // Temporary logging.
                    var scopes = [];
                    var w = win.wrappedJSObject;
                    while (w) {
                        scopes.push(Object.getOwnPropertyNames(w).filter(function(x) /tos/i.test(x.substr(0,3))).join(","));
                        w = Object.getPrototypeOf(w);
                    }
                    FBTest.progress("matches: " + scopes.join("|"));
                }

                callback();
            }

            var tasks = new FBTest.TaskList();
            tasks.push(testWithPopup, "Object.prototype.", "toString", true);
            tasks.push(testWithPopup, "Object.", "prototype", true);
            tasks.push(testWithPopup, "Object.getOwn", "PropertyNames", true);
            tasks.push(testWithPopup, "do", "cument", false);
            tasks.push(testWithPopup, "document._", "_proto__", false);
            tasks.push(testWithPopup, "obj1.", "aa1", true);
            tasks.push(testWithPopup, "obj2.", "aa1", true);

            tasks.push(testHidden, "String.prototype.toLocaleU");
            tasks.push(testHidden, "''.toLocaleU");
            tasks.push(testHidden, "tos");
            tasks.push(testHidden, "document.body.__lo");
            tasks.push(testHidden, "alert.arg");
            tasks.push(testHidden, "document.body.vLin");

            tasks.run(function()
            {
                FBTest.testDone("issue959.DONE");
            }, 0);
        });
    });
}
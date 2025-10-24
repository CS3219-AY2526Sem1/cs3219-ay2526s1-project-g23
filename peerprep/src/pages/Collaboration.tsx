import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Editor from "@monaco-editor/react";
import DOMPurify from "dompurify";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

// TODO: Remove static content
const title = "Container With Most Water";
const difficulty = "Medium";
const topics = ["Greedy"];
const content = `<p>You are given an integer array <code>height</code> of length <code>n</code>. There are <code>n</code> vertical lines drawn such that the two endpoints of the <code>i<sup>th</sup></code> line are <code>(i, 0)</code> and <code>(i, height[i])</code>.</p>

<p>Find two lines that together with the x-axis form a container, such that the container contains the most water.</p>

<p>Return <em>the maximum amount of water a container can store</em>.</p>

<p><strong>Notice</strong> that you may not slant the container.</p>

<p>&nbsp;</p>
<p><strong class="example">Example 1:</strong></p>
<img alt="" src="https://s3-lc-upload.s3.amazonaws.com/uploads/2018/07/17/question_11.jpg" style="width: 600px; height: 287px;" />
<pre>
<strong>Input:</strong> height = [1,8,6,2,5,4,8,3,7]
<strong>Output:</strong> 49
<strong>Explanation:</strong> The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.
</pre>

<p><strong class="example">Example 2:</strong></p>

<pre>
<strong>Input:</strong> height = [1,1]
<strong>Output:</strong> 1
</pre>

<p>&nbsp;</p>
<p><strong>Constraints:</strong></p>

<ul>
	<li><code>n == height.length</code></li>
	<li><code>2 &lt;= n &lt;= 10<sup>5</sup></code></li>
	<li><code>0 &lt;= height[i] &lt;= 10<sup>4</sup></code></li>
</ul>
`;
const partner = "John Doe";

const Collaboration = () => {
  const username = localStorage.getItem("username") || "";
  const { session } = useParams();
  const ydocument = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [cursorStyleSheet, setCursorStyleSheet] =
    useState<CSSStyleSheet | null>(null);

  useEffect(() => {
    const stylesheet = document.createElement("style");
    document.head.appendChild(stylesheet);
    setCursorStyleSheet(stylesheet.sheet);

    return () => {
      document.head.removeChild(stylesheet);
    };
  }, []);

  useEffect(() => {
    const provider = new WebsocketProvider(
      "ws://localhost:3004",
      session as string,
      ydocument
    );
    setProvider(provider);

    return () => {
      provider?.destroy();
      ydocument.destroy();
    };
  }, [ydocument]);

  useEffect(() => {
    if (provider == null || editor == null) {
      return;
    }

    const awareness = provider.awareness;
    awareness.setLocalState({ user: username });
    awareness.on("update", addCursorStyle);

    const binding = new MonacoBinding(
      ydocument.getText("monaco"),
      editor.getModel(),
      new Set([editor]),
      awareness
    );

    return () => {
      binding?.destroy();
    };
  }, [ydocument, provider, editor]);

  const addCursorStyle = () => {
    if (!provider) {
      return;
    }

    provider?.awareness.getStates().forEach(({ user }, clientId) => {
      if (user == username) {
        return;
      }

      for (let i = cursorStyleSheet?.cssRules.length - 1; i >= 0; i--) {
        if (cursorStyleSheet?.cssRules[i].cssText.includes(clientId)) {
          cursorStyleSheet.deleteRule(i);
        }
      }

      const COLOR_POOL = [
        ["oklch(89.2% 0.058 10.001)", "oklch(64.5% 0.246 16.439)"], // rose
        ["oklch(87% 0.065 274.039)", "oklch(58.5% 0.233 277.117)"], // indigo
        ["oklch(88.2% 0.059 254.128)", "oklch(62.3% 0.214 259.815)"], // blue
        ["oklch(93.8% 0.127 124.321)", "oklch(76.8% 0.233 130.85)"], // lime
        ["oklch(92.4% 0.12 95.746)", "oklch(76.9% 0.188 70.08)"], // amber
      ];
      const color = COLOR_POOL[clientId % COLOR_POOL.length];

      cursorStyleSheet?.insertRule(
        `.yRemoteSelection-${clientId} {
            background-color: ${color[0]};
        }`,
        cursorStyleSheet.cssRules.length
      );
      cursorStyleSheet?.insertRule(
        `.yRemoteSelectionHead-${clientId} {
            position: absolute;
            border-left: ${color[1]} solid 2px;
            border-top: ${color[1]} solid 2px;
            border-bottom: ${color[1]} solid 2px;
            height: 100%;
            box-sizing: border-box;
        }`,
        cursorStyleSheet.cssRules.length
      );
      cursorStyleSheet?.insertRule(
        `.yRemoteSelectionHead-${clientId}:hover::after {
            position: absolute;
            content: "${user}";
            font-size: smaller;
            background-color: ${color[1]};
            color: oklch(98.5% 0 0);
            border-radius: 4px;
            padding: 0px 4px;
            left: -2px;
            top: -20px;
        }`,
        cursorStyleSheet.cssRules.length
      );
    });
  };

  // @ts-ignore
  const onEditorDidMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyCode.F1, () => {
      // Note: Disable the command palette
    });
    setEditor(editor);
  };

  return (
    <div className="w-full h-[calc(100vh-121px)] grid grid-cols-2 gap-6 py-10 px-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge>{difficulty}</Badge>
            {topics.map((topic) => (
              <Badge key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-340px)] p-3 bg-slate-50 rounded-md border">
            <div
              className="prose prose-sm [&>*]:text-wrap"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(content),
              }}
            />
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 col-span-1">
        <div className="flex justify-between items-center">
          <div>
            Collaborating With: <span className="font-medium">{partner}</span>
          </div>
          <Button>End Session</Button>
        </div>
        <Card className="h-full">
          <CardContent className="h-full px-1">
            <Editor
              defaultLanguage="python"
              options={{
                minimap: { enabled: false },
                stickyScroll: { enabled: false },
                scrollBeyondLastLine: false,
                contextmenu: false,
              }}
              onMount={onEditorDidMount}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Collaboration;

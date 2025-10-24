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
  const { session } = useParams();
  const ydocument = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

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

    const ytext = ydocument.getText("monaco");
    if (ytext.length === 0) {
      ytext.insert(0, `# Write your solution here \n\n\n`);
      ytext.length; // Note: Required to update length after inserting
    }

    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );

    return () => {
      binding.destroy();
    };
  }, [ydocument, provider, editor]);

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

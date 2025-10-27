import { getMatchSession } from "@/api/matching-service";
import { getQuestionById } from "@/api/question-service";
import Spinner from "@/components/custom/spinner";
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
import { useEffect, useMemo, useState, useTransition } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

const Collaboration = () => {
  const username = localStorage.getItem("username") || "";

  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [loading, startTransition] = useTransition();

  const ydocument = useMemo(() => new Y.Doc(), []);
  const [editor, setEditor] = useState<any>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [cursorStyleSheet, setCursorStyleSheet] =
    useState<CSSStyleSheet | null>(null);
  const [sessionPartner, setSessionPartner] = useState(null);
  const [question, setQuestion] = useState({
    title: "",
    difficulty: "",
    topics: [],
    content: "",
  });

  useEffect(() => {
    // Insert dynamic stylesheet for cursor generation
    const stylesheet = document.createElement("style");
    document.head.appendChild(stylesheet);
    setCursorStyleSheet(stylesheet.sheet);

    startTransition(async () => {
      // Get session and question details
      let session;
      try {
        session = await getMatchSession(sessionId!);
      } catch {
        navigate("/");
        toast.error("Collaboration session does not exist");
      }

      const { questionId, participants } = session;
      const question = await getQuestionById(questionId);
      setQuestion(question);

      const partner = participants.find(
        (user: { username: string }) => user.username != username
      );
      setSessionPartner(partner.username);
    });

    return () => {
      document.head.removeChild(stylesheet);
    };
  }, []);

  useEffect(() => {
    const provider = new WebsocketProvider(
      "ws://localhost:3004",
      sessionId as string,
      ydocument
    );
    setProvider(provider);

    return () => {
      provider?.destroy();
      ydocument.destroy();
    };
  }, [ydocument, sessionId]);

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

      // @ts-ignore
      for (let i = cursorStyleSheet?.cssRules.length - 1; i >= 0; i--) {
        if (
          cursorStyleSheet?.cssRules[i].cssText.includes(clientId.toString())
        ) {
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

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="w-full h-[calc(100vh-121px)] grid grid-cols-2 gap-6 py-10 px-6">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-xl">{question.title}</CardTitle>
          <CardDescription className="flex flex-wrap gap-2">
            <Badge>{question.difficulty}</Badge>
            {question.topics.map((topic) => (
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
                __html: DOMPurify.sanitize(question.content),
              }}
            />
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-4 col-span-1">
        <div className="flex justify-between items-center">
          <div>
            Collaborating With:{" "}
            <span className="font-medium">{sessionPartner}</span>
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

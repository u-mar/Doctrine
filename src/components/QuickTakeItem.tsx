
interface QuickTakeItemProps {
  content: string;
}

export default function QuickTakeItem({ content }: QuickTakeItemProps) {
  return (
    <div className="py-4 border-b">
      <p className="text-lg">{content}</p>
    </div>
  );
}

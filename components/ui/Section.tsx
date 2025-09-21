export function Section({ id, title, children }:{
  id?:string; title?:string; children:React.ReactNode
}) {
  return (
    <section id={id} className="py-14">
      <div className="mx-auto max-w-6xl px-4">
        {title && <h2 className="text-2xl md:text-3xl font-semibold heading mb-6">{title}</h2>}
        {children}
      </div>
    </section>
  );
}


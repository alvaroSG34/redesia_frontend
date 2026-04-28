import { NewClientForm } from "@/components/screens/new-client-form";

export default function NewClientPage() {
  return (
    <section className="mx-auto w-full max-w-[840px] space-y-6 py-6">
      <h1 className="text-[46px] font-bold tracking-tight text-[#182033]">Agregar nuevo cliente</h1>
      <NewClientForm />
    </section>
  );
}

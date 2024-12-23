import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ServicesSection() {
  const services = [
    {
      title: "Taglio Classico",
      description: "Taglio tradizionale con rifinitura precisa",
      price: "€25"
    },
    {
      title: "Barba",
      description: "Rasatura professionale e cura della barba",
      price: "€20"
    },
    {
      title: "Taglio + Barba",
      description: "Combinazione di taglio capelli e cura della barba",
      price: "€40"
    },
    {
      title: "Shampoo & Styling",
      description: "Lavaggio professionale e styling personalizzato",
      price: "€15"
    }
  ];

  return (
    <section id="servizi" className="py-20 bg-amber-50/50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-amber-800 dark:text-amber-400">
          I Nostri Servizi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="bg-white dark:bg-zinc-800 border-amber-200 dark:border-zinc-700">
              <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-300">{service.title}</CardTitle>
                <CardDescription className="dark:text-zinc-400">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{service.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
